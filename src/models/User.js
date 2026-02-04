import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    isVerified: { type: Boolean, default: false },
    car: {
      vin: { type: String, required: true },
      make: { type: String },
      model: { type: String },
      year: { type: Number },
      color: { type: String },
      mileage: { type: Number },
      licensePlate: { type: String },
      engine: { type: String },
      transmission: { type: String },
      driveType: { type: String },
      fuelType: { type: String },
    },
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
        assignedWorker: {
          id: { type: String, required: true },
          name: { type: String, required: true },
          phone: { type: String, required: true },
        },
        repairItems: [
          {
            partsId: { type: String, required: true },
            items: [String],
          },
        ],
        notes: [{ type: String, default: "" }],
      },
    ],
    parts: [
      {
        id: { type: String, required: true, unique: true },
        items: [
          {
            partId: { type: String, required: true },
            name: { type: String, required: true },
            brand: { type: String, required: true },
            article: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            source: { type: String, required: true },
            arrivalDate: { type: Date, default: null },
            status: {
              type: String,
              enum: ["pending", "ordered", "received", "installed"],
              default: "pending",
            },
          },
        ],
        purchaseDate: { type: Date, default: null },
      },
    ],
    aiTips: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "low",
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    chatId: {
      source: { type: String, required: true },
      id: { type: String, required: true, unique: true },
    },
    firstVisit: { type: Date, default: null },
    lastVisit: { type: Date, default: null },
    nextAppointment: { type: Date, default: null },
    totalSpent: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    futureNotes: [
      {
        id: { type: String, required: true },
        master: { type: String, required: true },
        note: { type: String, required: true },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "low",
        },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
