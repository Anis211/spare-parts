import mongoose from "mongoose";

const pendingOrderSchema = new mongoose.Schema(
  {
    chatId: { type: Number, required: true },
    partNumbers: [
      {
        partName: { type: String },
        brand: { type: String },
        orderQuantity: { type: Number, min: 1 },
        partPrice: { type: Number, default: 0 },
      },
    ],
    createdAt: { type: Date, default: Date.now() },
  },
  { timestamps: true }
);

const PendingOrder =
  mongoose.models.PendingOrder ||
  mongoose.model("PendingOrder", pendingOrderSchema);
export default PendingOrder;
