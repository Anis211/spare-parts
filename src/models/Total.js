import mongoose from "mongoose";

const totalSchema = new mongoose.Schema(
  {
    totalCount: Number,
  },
  { timestamps: true }
);

const Total = mongoose.models.Total || mongoose.model("Total", totalSchema);

export default Total;
