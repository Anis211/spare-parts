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

  let tempFilePath = null;

  try {
    // Parse multipart form data
    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      filename: (name, ext, part) => {
        return `voice-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      },
    });

    const [fields, files] = await form.parse(req);

    // Validate file exists
    if (!files?.audio?.[0]) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const audioFile = files.audio[0];
    tempFilePath = audioFile.filepath;

    console.log("Audio file received:", {
      originalFilename: audioFile.originalFilename,
      mimetype: audioFile.mimetype,
      size: audioFile.size,
      filepath: audioFile.filepath,
    });

    // Read file as Buffer (NO conversion needed)
    const fileBuffer = fs.readFileSync(tempFilePath);

    // Create FormData with RAW file buffer
    const openaiFormData = new FormData();

    // CRITICAL: Use File constructor if available, otherwise Blob
    let fileBlob;
    if (typeof File !== "undefined") {
      // Browser/Edge runtime
      fileBlob = new File([fileBuffer], "audio.webm", {
        type: audioFile.mimetype || "audio/webm",
      });
    } else {
      // Node.js runtime
      fileBlob = new Blob([fileBuffer], {
        type: audioFile.mimetype || "audio/webm",
      });
    }

    openaiFormData.append("file", fileBlob, "audio.webm");
    openaiFormData.append("model", "whisper-1");
    openaiFormData.append("language", "ru");
    openaiFormData.append("response_format", "json");

    // FIX: Remove trailing spaces from URL!
    const openaiRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions", // ✅ No spaces!
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: openaiFormData,
      },
    );

    // Cleanup temp file BEFORE error handling
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    }

    if (!openaiRes.ok) {
      const err = await openaiRes
        .json()
        .catch(() => ({ error: { message: "Unknown OpenAI error" } }));
      console.error("OpenAI Error:", err);
      return res.status(openaiRes.status).json({
        error: err.error?.message || "Transcription failed",
      });
    }

    const { text } = await openaiRes.json();

    res.status(200).json({
      success: true,
      transcription: text.trim(),
    });
  } catch (error) {
    console.error("Transcription handler error:", error);

    // Cleanup on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    }

    res.status(500).json({
      error: "Transcription failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
