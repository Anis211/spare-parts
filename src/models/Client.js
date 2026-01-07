// customerVehicle.model.ts
import mongoose from "mongoose";

const customerVehicleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    name: { type: String, required: true },
    totalSpent: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true },
    vin: { type: String, required: true, unique: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 2,
    },
    vehicleNotes: { type: String, default: "" },
    lastVisit: { type: Date, default: null },
    nextAppointment: { type: Date, default: null },
  },
  { timestamps: true }
);

// Optional: index for common queries
customerVehicleSchema.index({ phone: 1 });
customerVehicleSchema.index({ vin: 1 });
customerVehicleSchema.index({ nextAppointment: 1 });

const CustomerVehicle =
  mongoose.models.CustomerVehicle ||
  mongoose.model("CustomerVehicle", customerVehicleSchema);

export default CustomerVehicle;
