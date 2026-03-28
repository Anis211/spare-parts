// models/ShatemAuth.js
import mongoose from "mongoose";

const shatemAuthSchema = new mongoose.Schema({
  // Antiforgery token
  antiforgery: {
    value: { type: String, default: "" },
    expires: { type: Date, default: null },
  },
  // Access token (JWT)
  x_access_token: {
    value: { type: String, default: "" },
    expires: { type: Date, default: null },
  },
  // Refresh token (JWT)
  x_refresh_token: {
    value: { type: String, default: "" },
    expires: { type: Date, default: null },
  },
  // Metadata
  lastRefreshed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
shatemAuthSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const ShatemAuth =
  mongoose.models.ShatemAuth || mongoose.model("ShatemAuth", shatemAuthSchema);

export default ShatemAuth;
