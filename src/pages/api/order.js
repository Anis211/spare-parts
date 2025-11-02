import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";
import Worker from "@/models/Worker";

// Connect to MongoDB when the API route is accessed
connectDB();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { parts, user } = req.body;
      const items = [];

      for (const part of parts) {
        let fromStock = false;
        let stockData = null;

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;

        const response = await fetch(
          `${baseUrl}/api/mock/stock?partNumber=${encodeURIComponent(
            part.article
          )}`,
          { method: "GET" }
        );

        stockData = await response.json();
        fromStock = stockData.part !== undefined;

        console.log(stockData);
        console.log(parts);

        items.push({
          partNumber: part.article,
          partName: part.partName,
          brand: part.brand,
          quantity: part.orderQuantity,
          price: part.partPrice,
          imageUrls: part.pictures,
          fromStock: fromStock,
          place: !fromStock
            ? `https://ns.rossko.ru/product?sid=4920cdb501d67a6787a1dc6229b7af50&q=${
                part.article
              }&text=${part?.guid || ""}`
            : stockData.part.place,
        });
      }

      let availableWorkers = await Worker.find({
        $expr: { $lt: [{ $size: "$activeOrders" }, 8] },
      });

      if (availableWorkers.length === 0) {
        availableWorkers = await Worker.find({
          $expr: { $lt: [{ $size: "$activeOrders" }, 10] },
        });
      }
      const worker = availableWorkers[0];
      const lastOrder = await Order.findOne().sort({ createdAt: -1 });

      let nextNumber = 1;
      if (lastOrder && lastOrder.orderId) {
        const match = lastOrder.orderId.match(/^ORD-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const formattedNumber = nextNumber.toString().padStart(3, "0");

      const newOrder = new Order({
        orderId: "ORD-" + formattedNumber,
        customerId: user._id,
        customerData: {
          name: user.lastName + user.firstName,
          phone: user.phone,
          email: user.email,
        },
        address: {
          city: user.city,
          street: null,
          building: null,
          apartment: null,
        },
        items: items,
        workerData: {
          id: worker.id,
          name: worker.name,
        },
      });
      await newOrder.save();

      await Worker.findOneAndUpdate(
        { id: worker.id },
        {
          $push: {
            activeOrders: "ORD-" + formattedNumber,
          },
        }
      );

      // Return success response
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: newOrder,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "GET") {
    const { email, countl, countr } = req.query;

    try {
      if (email === "admin") {
        const orders = await Order.find({}).skip(countl).limit(countr);
        res.status(200).json(orders);
      } else {
        res.status(500).json("Only Admins Can See Orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    const { status, orderId, itemIndex } = req.body;

    // Validate inputs
    if (itemIndex < 0 || !Number.isInteger(itemIndex)) {
      return res.status(400).json({ error: "Invalid item index" });
    }

    try {
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: orderId },
        {
          $set: {
            [`items.${itemIndex}.adminStatus`]: status,
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if the index was valid (MongoDB won't error for invalid array index)
      if (itemIndex >= updatedOrder.items.length) {
        return res.status(400).json({ error: "Item index out of bounds" });
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("Error updating order item status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
