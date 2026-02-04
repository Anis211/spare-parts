import { formidable } from "formidable";
import fs from "fs";
import os from "os";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse multipart form data (formidable v3+)
    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      filename: (name, ext, part) => {
        const mimeType = part.mimetype || "audio/webm";
        const extension = mimeType.includes("mp4")
          ? ".mp4"
          : mimeType.includes("wav")
            ? ".wav"
            : ".webm";
        return `voice-${Date.now()}${extension}`;
      },
    });

    const [fields, files] = await form.parse(req);

    // Validate file exists
    if (!files?.audio?.[0]) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const audioFile = files.audio[0];
    const mimeType = audioFile.mimetype || "audio/webm";

    // Determine correct extension based on actual MIME type
    const ext = mimeType.includes("mp4")
      ? "mp4"
      : mimeType.includes("wav")
        ? "wav"
        : "webm";
    const filename = `recording.${ext}`;

    // Read file buffer
    const fileBuffer = fs.readFileSync(audioFile.filepath);

    // Send to OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append(
      "file",
      new Blob([fileBuffer], { type: mimeType }),
      filename,
    );
    openaiFormData.append("model", "whisper-1");
    openaiFormData.append("language", "ru");

    const openaiRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: openaiFormData,
      },
    );

    // Cleanup temp file
    fs.unlinkSync(audioFile.filepath);

    if (!openaiRes.ok) {
      const err = await openaiRes.json();
      console.error("OpenAI Error:", err);
      throw new Error(err.error?.message || "Transcription failed");
    }

    const { text } = await openaiRes.json();

    res.status(200).json({
      success: true,
      transcription: text.trim(),
    });
  } catch (error) {
    console.error("Transcription handler error:", error);
    res.status(500).json({
      error: "Transcription failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
