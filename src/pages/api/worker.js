import connectDB from "@/lib/mongoose";
import Worker from "@/models/Worker";

connectDB();

export default async function handler(req, res) {
  if (req.method == "POST") {
    const { name, phone, id } = req.body;
    console.log("started worker proxy api");

    try {
      const newWorker = new Worker({
        name: name,
        phoneNumber: phone,
        id: id,
        activeOrders: [],
        deliveredOrders: [],
      });
      await newWorker.save();

      console.log(newWorker);

      // Return success response
      res.status(201).json({
        success: true,
        message: "Worker created successfully",
        worker: newWorker,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method == "GET") {
    const { isWorker } = req.query;
    console.log("I Am Here");

    const workers = await Worker.find({});
    res.status(200).json({ workers: workers });
  } else {
    res.status(500).json({ error: "The Method Is Not Allowed" });
  }
}
