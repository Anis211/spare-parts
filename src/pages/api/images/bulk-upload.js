// pages/api/images/bulk-upload.js
import { getGrid } from "@/lib/gridfs";

const saveToGridFS = async ({ buffer, contentType, filename }) => {
  const { bucket } = await getGrid();
  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, {
      metadata: { contentType },
    });
    upload.on("error", reject);
    upload.on("finish", () => resolve(upload.id)); // returns ObjectId
    upload.end(buffer);
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { images = [] } = req.body; // массив dataURL или "чистого" base64

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;

    const urls = await Promise.all(
      images.map(async (value, idx) => {
        try {
          // value может быть dataURL "data:image/jpeg;base64,..." или просто base64
          const base64 = value.includes(",") ? value.split(",")[1] : value;
          const buffer = Buffer.from(base64, "base64");
          const contentType = value.match(/^data:(.*?);/)?.[1] || "image/jpeg";
          const filename = `chat_${Date.now()}_${idx}.jpg`;

          const id = await saveToGridFS({
            buffer,
            contentType,
            filename,
          });

          return `${baseUrl}/api/images/${id.toString()}`;
        } catch (e) {
          console.warn("GridFS save skipped:", e.message);
          return null;
        }
      })
    );

    // фильтр на случай ошибок по отдельным файлам
    const filtered = urls.filter(Boolean);

    return res.status(200).json({ urls: filtered });
  } catch (err) {
    console.error("bulk-upload error:", err);
    return res.status(500).json({ error: "Failed to upload images" });
  }
}
