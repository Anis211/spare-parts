import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    isVerified: { type: Boolean, default: false },
    cars: [
      {
        vin: { type: String, required: true },
        make: { type: String },
        model: { type: String },
        year: { type: Number },
      },
    ],
    repairWorks: [
      {
        id: { type: String, required: true },
        description: { type: String, required: true },
        status: {
          type: String,
          enum: ["appointed", "in-progress", "completed"],
          default: "appointed",
        },
        cost: { type: Number, required: true },
        arrivalDate: { type: Date, default: Date.now },
        completedDate: { type: Date, default: null },
        assignedWorker: { type: String, default: null },
        repairItems: [String],
      },
    ],
    parts: [
      {
        items: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            brand: { type: String, required: true },
            article: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
          },
        ],
        purchaseDate: { type: Date, default: null },
        purchaseStatus: {
          type: String,
          enum: ["pending", "paid"],
          default: "pending",
        },
        repairWorkId: { type: String, default: null },
      },
    ],
    aiTips: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    chatId: {
      source: { type: String, required: true },
      id: { type: String, required: true, unique: true },
    },
    lastVisit: { type: Date, default: null },
    nextAppointment: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
