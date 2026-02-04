import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    client: {
      id: { type: String, required: true },
      phone: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String },
      car: {
        vin: { type: String, required: true },
        make: { type: String },
        model: { type: String },
        year: { type: Number },
      },
    },
    repairWorks: [
      {
        id: { type: String, required: true },
        serviceType: { type: String, required: true },
        description: { type: String, required: true },
        status: {
          type: String,
          enum: ["appointed", "in-progress", "completed"],
          default: "appointed",
        },
        cost: { type: Number, required: true },
        assignedWorker: {
          id: { type: String, required: true },
          name: { type: String, required: true },
          phone: { type: String, required: true },
        },
        repairItems: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            partNumber: { type: String, required: true },
            quantity: { type: Number, required: true },
            unitPrice: { type: Number, required: true },
            totalPrice: { type: Number, required: true },
            purchaseDate: { type: Date, default: null },
            arrivalDate: { type: Date, default: null },
            status: {
              type: String,
              enum: ["pending", "ordered", "received", "installed"],
              default: "pending",
            },
          },
        ],
        repairPartsNeeded: [
          {
            master: { type: String, required: true },
            parts: [String],
            repair: { type: String, required: true },
            status: {
              type: String,
              enum: ["pending", "ordered", "received", "installed"],
              default: "pending",
            },
          },
        ],
        notes: [{ type: String, default: "" }],
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: [{ type: String, default: "" }],
  },
  { timestamps: true }
);

const Reservation =
  mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);

export default Reservation;
