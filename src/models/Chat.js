import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    chatData: [
      {
        original: {
          name: String,
          brand: String,
          guid: String,
          article: String,
        },
        analogs: [
          {
            original_id: String,
            article: String,
            brand: String,
            name: String,
            guid: String,
            pictures: [String],
            stocks: [
              {
                partPrice: Number,
                place: String,
                delivery: {
                  end: String,
                  start: String,
                },
              },
            ],
            sources: [String],
          },
        ],
      },
    ],
    chat: [
      {
        text: { type: String, required: true, maxlength: 1000 },
        embedding: {
          type: [Number],
          validate: [
            (array) => !array || array.length === 1536,
            "Embedding must be 1536-dimensional",
          ],
        },
        metadata: {
          role: {
            type: String,
            enum: ["user", "assistant", "system"],
            required: true,
          },
          createdAt: { type: Date, default: Date.now },
        },
      },
    ],
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
