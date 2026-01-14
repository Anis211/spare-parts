import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    speciality: { type: String, required: true },
    currentMonthWorks: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        clientName: { type: String, required: true },
        clientPhone: { type: String, required: true },
        car: {
          vin: { type: String, required: true },
          make: { type: String, required: true },
          model: { type: String, required: true },
          year: { type: Number, required: true },
        },
        laborCost: { type: Number, required: true },
        completeDate: { type: Date, default: null },
        status: {
          type: String,
          enum: ["appointed", "in-progress", "completed"],
          default: "appointed",
        },
        notes: { type: String, default: "" },
      },
    ],
    totalEarned: { type: Number, required: true, default: 0 },
    totalPaid: { type: Number, required: true, default: 0 },
    payments: [
      {
        id: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        description: { type: String, default: "" },
      },
    ],
    monthlyEarnings: [
      {
        month: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Worker = mongoose.models.Worker || mongoose.model("Worker", workerSchema);

export default Worker;
