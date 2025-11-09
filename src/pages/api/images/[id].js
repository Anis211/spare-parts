import { ObjectId } from "mongodb";
import { getGrid } from "@/lib/gridfs";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id || !ObjectId.isValid(id)) return res.status(400).send("Bad id");

    const { bucket, db } = await getGrid();
    const file = await db
      .collection("images.files")
      .findOne({ _id: new ObjectId(id) });
    if (!file) return res.status(404).send("Not found");

    res.setHeader(
      "Content-Type",
      file?.metadata?.contentType || "application/octet-stream"
    );
    bucket
      .openDownloadStream(new ObjectId(id))
      .on("error", () => res.status(404).end())
      .pipe(res);
  } catch (e) {
    console.error("Image fetch error:", e);
    res.status(500).send("Server error");
  }
}
