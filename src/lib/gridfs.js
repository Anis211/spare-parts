import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridBucket = null;

export const getGrid = async () => {
  // ensure mongoose connection is ready
  if (mongoose.connection.readyState === 0) {
    throw new Error("Mongoose is not connected. Call connectDB() first.");
  }

  if (!gridBucket) {
    gridBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "images",
    });
  }

  return { bucket: gridBucket, db: mongoose.connection.db };
};
