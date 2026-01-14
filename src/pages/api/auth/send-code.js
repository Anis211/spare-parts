import bcrypt from "bcryptjs";
import OTP from "@/models/admin/Otp";
import smsProvider from "@/lib/sms";
import connectDB from "@/lib/mongoose";

connectDB();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone } = await req.body;
  console.log(phone);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);

  await OTP.create({
    phone,
    codeHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });

  await smsProvider.send(phone, `Your code is ${code}`);

  return Response.json({ success: true });
}
