// models/AutotradeAuth.js
import mongoose from "mongoose";

const autotradeAuthSchema = new mongoose.Schema({
  // Cookie jar (serialized JSON string)
  cookie_jar: {
    value: { type: String, default: "" },
    expires: { type: Date, default: null },
  },
  // Metadata
  lastRefreshed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
autotradeAuthSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const AutotradeAuth =
  mongoose.models.AutotradeAuth ||
  mongoose.model("AutotradeAuth", autotradeAuthSchema);

export default AutotradeAuth;
