import mongoose from "mongoose";

const alatradeSchema = new mongoose.Schema({
  ci_session: {
    value: { type: String, default: "" },
    expires: { type: Date, default: null },
  },
  rem_id: {
    value: { type: String, default: "" },
    expires: { type: Date, default: null },
  },
});

const Alatrade =
  mongoose.models.Alatrade || mongoose.model("Alatrade", alatradeSchema);

export default Alatrade;
