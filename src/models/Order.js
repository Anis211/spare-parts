import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerData: {
      name: String,
      phone: String,
      email: String,
    },
    address: {
      city: { type: String, default: "Бишкек" },
      street: { type: String, default: "Киевская" },
      building: { type: String, default: "95" },
      apartment: { type: String, default: "" },
    },
    items: [
      {
        partNumber: { type: String, required: true },
        partName: { type: String, required: true },
        brand: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        fromStock: { type: Boolean, required: true },
        place: { type: String, required: true },
        imageUrls: [String],
        adminStatus: {
          type: String,
          enum: ["Pending", "Ordered", "Passed"],
          default: "Pending",
        },
      },
    ],
    shippingStatus: {
      type: String,
      enum: ["Pending", "Getting There", "Delivered"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
