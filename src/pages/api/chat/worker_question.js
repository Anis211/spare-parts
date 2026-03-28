import connectDB from "@/lib/mongoose";
import { OpenAI } from "openai";

import Worker from "@/models/admin/RepairWorker";
import Calendar from "@/models/Calendar";
import Reservation from "@/models/admin/Reservation";
import User from "@/models/User"; // ADDED: Import User model

import {
  MicroBatcher,
  openaiMessagesTransportFactory,
} from "@/lib/microBatcher.js";
import { createLimitedCaller } from "@/lib/limiterBackoff";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});

// === Rate limiter + backoff configuration ===
const REQS_PER_MIN = 60;
const ratePerSec = REQS_PER_MIN / 60;
const burstCapacity = 60;
const limitedCall = createLimitedCaller({ ratePerSec, burstCapacity });

// === Micro Batcher configuration ===
const chatBatcher = new MicroBatcher({
  maxBatchSize: 16,
  maxWaitMs: 50,
  transport: openaiMessagesTransportFactory({ openai }),
});

// === LLM Wrapper ===
const llmChat = (messages, options = {}) =>
  limitedCall(
    async () => {
      return chatBatcher.enqueue({ messages, options });
    },
    {
      cost: 1,
      backoffOpts: {
        maxRetries: 6,
        baseMs: 250,
        onShouldRetry: (err) => {
          const code = err?.code;
          const status = err?.status ?? err?.response?.status;
          const transientNet = [
            "ETIMEDOUT",
            "ECONNRESET",
            "EAI_AGAIN",
          ].includes(code);
          return (
            transientNet || status === 429 || (status >= 500 && status <= 599)
          );
        },
      },
    },
  );

// === Embedding Protection ===
async function safeEmbedding(input) {
  return limitedCall(
    async () => {
      return await openai.embeddings.create({
        model: "text-embedding-3-small",
        input,
      });
    },
    {
      cost: 1,
      backoffOpts: {
        maxRetries: 4,
        baseMs: 200,
      },
    },
  );
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "20mb" },
  },
};

export default async function handler(req, res) {
  await connectDB();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    const { userMessages, source, id, ...rest } = req.body;
    console.log("Started worker-question.js");

    if (!userMessages) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters",
      });
    }

    const userQuestion = userMessages.map((text) => ({
      role: "user",
      content: [{ type: "text", text: text }],
    }));

    console.log("workerQuestion: ", userQuestion);

    const worker = await Worker.findOne({ id: id }).lean();
    console.log("Worker: ", worker);
    console.log("Worker id: ", id);

    let pastMessages = worker.chat.messages.slice(
      worker.chat.messages.length - 20,
    );
    console.log("Past messages count: ", pastMessages?.length);

    if (!pastMessages) {
      pastMessages = [];
    }

    let messages = [
      {
        role: "system",
        content: `
You are a helpful auto-parts assistant for a car repair worker, with 1 function called next_appointment_slot.

Use next_appointment_slot to get the next available appointment slot for car repair. It returns date, time, service type, and client info.

Answer the worker's question based on the following rules:
- If the question is about the next appointment, use the next_appointment_slot function to get the info and include it in your answer.
- If the question is about car parts, repairs, or client history, answer based on the data you have.
- Always provide clear and concise answers. If you don't know the answer, say you don't know.

Formatting (critical):
Plain text only — real line breaks.
No markdown, "\\n", asterisks, or bold.
Each item/detail on its own line.
Separate items with blank lines.
Max one emoji per line.
Clarity > brevity.
`,
      },
    ];

    if (pastMessages.length > 0) {
      pastMessages.forEach((msg) => {
        messages.push({
          role: msg.metadata.role,
          content: msg.text,
        });
      });
    }
    userQuestion.map((message) => messages.push(message));

    const tools = [
      {
        type: "function",
        function: {
          name: "next_appointment_slot",
          description:
            "Get the next available appointment slot for car repair.",
        },
      },
    ];

    let queryEmbedding = null;
    let textForEmbedding = "";

    if (Array.isArray(userMessages) && userMessages.length > 0) {
      textForEmbedding = userMessages.join("\n");
    } else if (typeof userQuestion === "string" && userQuestion.trim()) {
      textForEmbedding = userQuestion;
    }

    try {
      if (textForEmbedding.trim().length > 0) {
        const embeddingResponse = await safeEmbedding(textForEmbedding);
        const vec = embeddingResponse?.data?.[0]?.embedding;

        if (Array.isArray(vec) && vec.length === 1536) {
          queryEmbedding = vec;
        } else {
          console.warn(
            "Unexpected embedding dimension:",
            Array.isArray(vec) ? vec.length : "no embedding",
          );
          queryEmbedding = null;
        }
      } else {
        queryEmbedding = null;
      }
    } catch (embeddingError) {
      console.warn("Embedding failed:", embeddingError);
      queryEmbedding = null;
    }

    const firstResponse = await llmChat(messages, {
      model: "gpt-4o",
      tools,
      tool_choice: "auto",
      temperature: 1,
    });

    const responseMessage = firstResponse.choices[0].message;

    const now = new Date();
    let aiResponse = null;
    let isNextRepair = false;
    let chatData = {};

    if (responseMessage.tool_calls?.length > 0) {
      const toolCall = responseMessage.tool_calls[0];

      if (toolCall.function?.name === "next_appointment_slot") {
        try {
          const currentDate = now.toISOString().split("T")[0];
          const targetDate = new Date(`${currentDate}T00:00:00.000Z`);

          const workerIdNum =
            typeof worker.id === "string" ? parseInt(worker.id, 10) : worker.id;

          let fullCalendar = await Calendar.findOne({
            date: targetDate,
          }).lean();
          if (!fullCalendar) throw new Error(`No calendar for ${currentDate}`);
          console.log("Full calendar for date:", fullCalendar);

          let workerCalendar = fullCalendar.workers.find(
            (w) => w.id === workerIdNum,
          );
          console.log("Worker calendar:", workerCalendar);

          if (workerCalendar.workload.length === 0) {
            console.log("No appointments for worker on this date");

            const targetDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
              ),
            );

            fullCalendar = await Calendar.findOne({
              date: targetDate,
            }).lean();
            if (!fullCalendar)
              throw new Error(
                `No calendar for ${targetDate.toISOString().split("T")[0]}`,
              );
            console.log("Full calendar for date:", fullCalendar);

            workerCalendar = fullCalendar.workers.find(
              (w) => w.id === workerIdNum,
            );
            console.log("Worker calendar number 2:", workerCalendar);
          }

          if (!workerCalendar)
            throw new Error(`Worker ${workerIdNum} not in calendar`);

          let closestWorkload = null;
          let minDiff = Infinity;

          for (const item of workerCalendar.workload) {
            const from = new Date(item.time_period.from);
            const to = new Date(item.time_period.to);

            if (to < now) continue;
            const diff = from.getTime() - now.getTime();
            if (diff >= 0 && diff < minDiff) {
              minDiff = diff;
              closestWorkload = item;
            }
          }
          console.log("Closest workload:", closestWorkload);

          if (!closestWorkload) {
            aiResponse = "No upcoming appointments found for today.";
          } else {
            const reservation = await Reservation.findOne({
              id: closestWorkload.reservation?.id,
            }).lean();

            if (!reservation?.client?.car) {
              aiResponse =
                "Appointment found, but client/car data is incomplete.";
            } else {
              const appointmentTime = new Date(
                closestWorkload.time_period.from,
              ).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              aiResponse = "Here is your next appointment slot";

              const repairWorks =
                reservation.repairWorks?.filter(
                  (rw) => rw.assignedWorker?.id == worker.id,
                ) || [];

              let hisRepairs = [];
              try {
                const user = await User.findOne({
                  id: reservation.client.id,
                }).lean();

                if (Array.isArray(user?.repairWorks)) {
                  hisRepairs = user.repairWorks.map((repairWork) => {
                    const workerData = repairWork.assignedWorker || {};
                    return {
                      id: repairWork.id,
                      date: repairWork.completionDate,
                      serviceType: repairWork.serviceType || "Unknown Service",
                      mileage:
                        reservation.client.car.mileage || "Unknown Mileage",
                      workerName: workerData.name || "Unknown Worker",
                    };
                  });
                }
              } catch (userErr) {
                console.warn("Could not fetch user repair history:", userErr);
              }

              const filteredHisRepairs = hisRepairs.filter(
                (hisRepair) =>
                  !repairWorks?.some(
                    (curRepair) => curRepair?.id === hisRepair?.id,
                  ),
              );
              console.log("Filtered repair history:", filteredHisRepairs);

              chatData.nextClientData = {
                id: String(reservation.id || ""),
                clientName: String(reservation.client.name || ""),
                carModel: String(reservation.client.car.model || ""),
                carYear: String(reservation.client.car.year || ""),
                licensePlate: String(reservation.client.car.licensePlate || ""),
                vin: String(reservation.client.car.vin || ""),
                mileage: String(reservation.client.car.mileage || ""),
                date:
                  reservation.date instanceof Date
                    ? reservation.date.toISOString()
                    : String(reservation.date || ""),
                time: String(reservation.startTime || ""),
                serviceType: repairWorks
                  .map((rw) => {
                    if (Array.isArray(rw.serviceType))
                      return rw.serviceType.join(", ");
                    return String(rw.serviceType || "").trim();
                  })
                  .filter(Boolean)
                  .join(", "),
                notes: repairWorks
                  .map((rw) => {
                    if (Array.isArray(rw.notes)) return rw.notes.join(", ");
                    return String(rw.notes || "").trim();
                  })
                  .filter(Boolean)
                  .join("; "),
                status: String(repairWorks[0]?.status || "scheduled"),
                previousRepairs: filteredHisRepairs,
                workerNotes: [],
              };

              isNextRepair = true;
              console.log("Chat data for next appointment:", chatData);
            }
          }
        } catch (toolErr) {
          console.error("Tool handling error:", toolErr);
          aiResponse =
            "Unable to retrieve appointment details. Please check calendar data.";
        }
      } else {
        aiResponse = "I can only help with next appointment queries right now.";
      }
    } else {
      aiResponse =
        responseMessage.content?.trim() ||
        "I'm processing your request. Please try rephrasing.";
    }

    if (
      !aiResponse ||
      typeof aiResponse !== "string" ||
      aiResponse.trim() === ""
    ) {
      aiResponse =
        "I encountered an issue generating a response. Please try again.";
    }
    aiResponse = aiResponse.trim();

    const combinedUserText =
      (Array.isArray(userMessages) && userMessages.length > 0
        ? userMessages.filter((m) => m?.trim()).join("\n")
        : "User message"
      ).trim() || "Empty user query";

    const chatUpdate = {
      text: combinedUserText,
      metadata: {
        role: "user",
        createdAt: new Date(),
        multi: Array.isArray(userMessages) && userMessages.length > 1,
        messages:
          Array.isArray(userMessages) && userMessages.length > 0
            ? userMessages
            : [combinedUserText],
      },
    };

    if (Array.isArray(queryEmbedding) && queryEmbedding.length === 1536) {
      chatUpdate.embedding = queryEmbedding;
    }

    const assistantMessage = {
      text: aiResponse,
      metadata: {
        role: "assistant",
        clientId: chatData.nextClientData?.id || null,
        createdAt: new Date(),
      },
    };

    const existingWorker = await Worker.findOne({ id });
    if (existingWorker) {
      await Worker.updateOne(
        { id },
        {
          $push: {
            "chat.messages": { $each: [chatUpdate, assistantMessage] },
          },
        },
        { runValidators: true },
      );

      if (chatData != null && Object.keys(chatData).length > 0) {
        if (isNextRepair) {
          const alreadyExists =
            existingWorker.chat.chatData?.nextClientData?.some(
              (client) => client.id === chatData.nextClientData.id,
            );

          if (!alreadyExists) {
            await Worker.updateOne(
              { id },
              {
                $push: {
                  "chat.chatData.nextClientData": chatData.nextClientData,
                },
              },
            );
          }
        }
      }
    }

    res.status(200).json({
      response: aiResponse,
      isNextRepair: isNextRepair,
      clientData: chatData.nextClientData || null,
      success: true,
    });
  } catch (error) {
    console.error("API Error:", error);

    if (
      error.message?.includes("timeout") ||
      error.message?.includes("timed out")
    ) {
      return res.status(408).json({
        success: false,
        message: "Request timeout. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
