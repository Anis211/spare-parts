import mongoose from "mongoose";
const { Schema } = mongoose;

// Sub-schema for parts
const PartSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  partNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

// Sub-schema for repair works
const RepairWorkSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  laborHours: { type: Number, required: true, min: 0 },
  laborCost: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    required: true,
  },
  parts: [PartSchema],
});

// Sub-schema for parts ordered
const PartsOrderedSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  partNumber: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "ordered", "shipped", "delivered"],
    default: "pending",
  },
  orderDate: {
    type: Date,
  },
  deliveryDate: {
    type: Date,
  },
});

// Main schema
const RepairOrderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g., "1", "2", ...
    vin: { type: String, required: true, index: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, default: "" },
    clientEmail: {
      type: String,
      match: /.+\@.+\..+/,
      default: "",
    },
    vehicleMake: { type: String },
    vehicleModel: { type: String },
    vehicleYear: { type: Number, min: 1900, max: 2030 },
    mileage: { type: Number, min: 0, default: 0 },
    arrivalDate: { type: Date },
    completionDate: { type: Date },
    workerName: { type: String, required: true },
    workerId: { type: String, required: true },
    notes: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    repairWorks: {
      type: [RepairWorkSchema],
    },
    partsOrdered: {
      type: [PartsOrderedSchema],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Add useful indexes
RepairOrderSchema.index({ status: 1, arrivalDate: -1 });
RepairOrderSchema.index({ clientEmail: 1, vin: 1 });

// Compile and export model
module.exports = mongoose.model("RepairOrder", RepairOrderSchema);
