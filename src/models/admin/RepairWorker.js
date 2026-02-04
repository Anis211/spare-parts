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
        client: {
          id: { type: String, required: true, unique: true },
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
    totalEarned: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
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
        amount: { type: Number, required: true },
      },
    ],
    chat: {
      chatData: {
        nextClientData: {
          id: { type: String, required: true, unique: true },
          clientName: { type: String, required: true },
          phone: { type: String, required: true },
          email: { type: String, required: true },
          carModel: { type: String, required: true },
          carYear: { type: String, required: true },
          licensePlate: { type: String, required: true },
          vin: { type: String, required: true },
          mileage: { type: String, required: true },
          date: { type: String, required: true },
          time: { type: String, required: true },
          serviceType: { type: String, required: true },
          notes: { type: String, default: "" },
          status: {
            type: String,
            enum: ["scheduled", "in-progress", "completed"],
            default: "scheduled",
          },
          previousRepairs: [
            {
              date: { type: String, required: true },
              serviceType: { type: String, required: true },
              mileage: { type: Number, required: true },
              workerName: { type: String, required: true },
            },
          ],
          workerNotes: [
            {
              workerName: { type: String, required: true },
              note: { type: String, required: true },
              date: { type: String, required: true },
            },
          ],
        },
      },
      messages: [
        {
          text: { type: String, required: true, maxlength: 5000 },
          embedding: {
            type: [Number],
            validate: {
              validator: function (array) {
                if (!array || array.length === 0) return true;
                // Если хочешь валидировать только user:
                // if (this.metadata?.role !== "user") return true;
                return array.length === 1536;
              },
              message: "Embedding must be 1536-dimensional",
            },
          },
          metadata: {
            role: {
              type: String,
              enum: ["user", "assistant", "system"],
              required: true,
            },
            createdAt: { type: Date, default: Date.now },
          },
        },
      ],
    },
  },
  { timestamps: true }
);

const Worker = mongoose.models.Worker || mongoose.model("Worker", workerSchema);

export default Worker;
