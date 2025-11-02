import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    activeOrders: [String],
    deliveredOrders: [
      {
        orderId: String,
        payment: Number,
        times: {
          orderTakenTime: Date,
          orderRecievedTime: Date,
          orderDeliveredTime: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

const Worker = mongoose.models.Worker || mongoose.model("Worker", workerSchema);

export default Worker;
