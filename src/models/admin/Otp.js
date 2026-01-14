import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  phone: String,
  codeHash: String,
  expiresAt: Date,
});

const OTP = mongoose.models.OTP || mongoose.model("OTP", OtpSchema);

export default OTP;
