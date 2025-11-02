import mongoose from "mongoose";

const PartSchema = new mongoose.Schema({
  STR_ID: {
    type: Number,
    required: true,
    unique: true,
  },
  STR_ID_PARENT: {
    type: Number,
    required: false,
  },
  STR_LEVEL: {
    type: Number,
    required: true,
  },
  STR_NODE_NAME: {
    type: String,
    required: true,
  },
  STR_PATH: {
    type: String,
    required: true,
  },
});

// Prevent model overwrite upon hot reloading
export default mongoose.models.Part || mongoose.model("Part", PartSchema);
