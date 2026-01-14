import bcrypt from "bcryptjs";
import OTP from "@/models/admin/Otp";
import connectDB from "@/lib/mongoose";

connectDB();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, code } = await req.json();
  const otp = await OTP.findOne({ phone });

  if (!otp || otp.expiresAt < new Date()) {
    return res.status(400).json({ error: "Code expired" });
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid code" });
  }

  await OTP.deleteOne({ phone });
  return res.status(200).json({ isValid: true });
}
