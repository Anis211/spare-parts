import mongoose from "mongoose";
const { Schema } = mongoose;

/* User object exactly as you send it */
const userSchema = new Schema(
  {
    part: String,
    vin: String,
    userImages: [String],
  },
  { _id: false }
);

/* Delivery schema */
const deliverySchema = new Schema(
  {
    start: String,
    end: String,
  },
  { _id: false }
);

/* Stock entry */
const stockSchema = new Schema(
  {
    partPrice: Number,
    place: String,
    delivery: deliverySchema,
  },
  { _id: false }
);

/* Analog part */
const analogSchema = new Schema(
  {
    article: String,
    brand: String,
    name: String,
    guid: String,
    pictures: [String],
    stocks: [stockSchema],
    sources: [String],
  },
  { _id: false }
);

/* Original part */
const originalSchema = new Schema(
  {
    name: String,
    brand: String,
    guid: String,
    article: String,
    pictures: [String],
  },
  { _id: false }
);

/* items { original, analogs } */
const itemsSchema = new Schema(
  {
    original: originalSchema,
    analogs: [analogSchema],
  },
  { _id: false }
);

/* ONE element in the array */
const recordSchema = new Schema(
  {
    user: userSchema,
    items: itemsSchema,
  },
  { _id: false }
);

/* FINAL MAIN SCHEMA */
const VinSchema = new Schema(
  {
    vin: { type: String, unique: true, required: true, uppercase: true },
    records: { type: [recordSchema], default: [] },
  },
  { timestamps: true }
);

const VinData = mongoose.models.VinData || mongoose.model("VinData", VinSchema);

export default VinData;
