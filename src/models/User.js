import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  country: String,
  city: String,
  totalOrders: Number,
  totalSpent: Number,
  status: String,
  orders: Array,
  history: Array,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
