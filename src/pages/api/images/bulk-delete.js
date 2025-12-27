// pages/api/images/bulk-delete.js
import { getGrid } from "@/lib/gridfs";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ids = [] } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }

    // Validate and convert to ObjectId
    const objectIds = ids.map((id) => {
      try {
        return new ObjectId(id);
      } catch (e) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }
    });

    const { bucket } = await getGrid();

    // Delete files from GridFS
    const results = await Promise.allSettled(
      objectIds.map(async (id) => {
        try {
          await bucket.delete(id);
          return { id: id.toString(), success: true };
        } catch (err) {
          // File may not exist — treat as success if "FileNotFound"
          if (err?.code === 1 || err?.message?.includes("FileNotFound")) {
            return {
              id: id.toString(),
              success: true,
              warning: "File not found",
            };
          }
          throw err;
        }
      })
    );

    const deleted = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r, idx) => ({
        id: objectIds[idx]?.toString(),
        error: r.reason?.message || "Unknown error",
      }));

    return res.status(200).json({
      message: "Bulk delete completed",
      deleted: deleted.length,
      failed: failed.length,
      details: {
        successes: deleted,
        failures: failed,
      },
    });
  } catch (err) {
    console.error("bulk-delete error:", err);
    return res
      .status(500)
      .json({ error: "Failed to delete images", message: err.message });
  }
}
