import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      source: {
        type: String,
        enum: ["website", "telegram", "whatsapp", "instagram"],
        required: true,
      },
      id: {
        type: String,
        required: true,
      },
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
        pagination: {
          total: { type: Number, default: 0 },
          batchSize: { type: Number, default: 7 },
          currentIndex: { type: Number, default: 0 },
          hasMore: { type: Boolean, default: false },
        },
      },
    ],
    chat: [
      {
        text: { type: String, required: true, maxlength: 5000 },
        embedding: {
          type: [Number],
          validate: {
            validator: function (array) {
              if (!array || array.length === 0) return true;
              // Если хочешь валидировать только user:
              // if (this.metadata?.role !== "user") return true;
              return array.length === 1536;
            },
            message: "Embedding must be 1536-dimensional",
          },
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
  { timestamps: true },
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
