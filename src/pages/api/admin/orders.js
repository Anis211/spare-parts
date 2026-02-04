import connectDB from "@/lib/mongoose";
import Reservation from "@/models/admin/Reservation";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    const { limitl, limitr } = req.body;

    if (limitl == undefined || limitr == undefined) {
      console.log("Something Wrong: ", limitl, ",", limitr);
      return res.status(400).json("Limits are Required!");
    }

    try {
      const reservations = [];
      const result = await Reservation.find({})
        .skip(limitl)
        .limit(limitr)
        .sort({ createdAt: -1 })
        .lean();

      for (const item of result) {
        reservations.push({
          id: item.id,
          vin: item.client.car.vin,
          clientName: item.client.name,
          clientPhone: item.client.phone,
          clientEmail: item.client.email,
          vehicleMake: item.client.car.make,
          vehicleModel: item.client.car.model,
          vehicleYear: item.client.car.year,
          arrivalDate:
            item.date.toISOString().split("T")[0] + " " + item.startTime,
          completionDate:
            item.endTime != undefined
              ? item.date.toISOString().split("T")[0] + " " + item.endTime
              : "",
          notes: item.notes,
          status: item.status,
          repairWorks: item.repairWorks.map((work) => ({
            id: work.id,
            name: work.serviceType,
            description: work.description,
            laborCost: work.cost,
            status: work.status,
            assignedWorker: {
              id: work.assignedWorker.id,
              name: work.assignedWorker.name,
              phone: work.assignedWorker.phone,
            },
            parts: work.repairItems.map((part) => ({
              id: part.id,
              name: part.name,
              partNumber: part.partNumber,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              totalPrice: part.totalPrice,
              purchaseDate: part.purchaseDate,
              arrivalDate: part.arrivalDate,
              status: part.status,
            })),
          })),
        });
      }

      return res.status(200).json({ orders: reservations });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
