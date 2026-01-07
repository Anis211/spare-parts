import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Bot, User, Send, Keyboard } from "lucide-react";
import { Button } from "@/components/repair/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/repair/ui/input";
import { ClientInfoPanel } from "@/components/repair/chat/ClientInfoPanel";
import { PinnedRepairBanner } from "@/components/repair/chat/PinnedRepairBanner";
import { PartsConfirmationPanel } from "@/components/repair/chat/PartsConfirmationPanel";

// Mock client data for next appointment
const nextClientData = {
  id: 2,
  clientName: "Sarah Williams",
  phone: "+1 (555) 987-6543",
  email: "sarah.williams@email.com",
  carModel: "BMW 330i",
  carYear: "2022",
  licensePlate: "XYZ-5678",
  vin: "WBA8E1C55JA765432",
  mileage: "28,450 mi",
  date: "2026-01-05",
  time: "11:30",
  serviceType: "Oil Change",
  notes: "Regular maintenance. Use synthetic oil. Customer prefers to wait.",
  status: "scheduled",
  previousRepairs: [
    {
      date: "2025-10-12",
      serviceType: "Brake Inspection",
      mileage: "25,100 mi",
      workerName: "Mike T.",
    },
    {
      date: "2025-07-08",
      serviceType: "Tire Rotation",
      mileage: "21,800 mi",
      workerName: "John D.",
    },
    {
      date: "2025-03-15",
      serviceType: "Oil Change",
      mileage: "18,200 mi",
      workerName: "Mike T.",
    },
  ],
  workerNotes: [
    {
      workerName: "Mike T.",
      note: "Great customer, always on time. Vehicle well-maintained.",
      date: "2025-10-12",
    },
    {
      workerName: "John D.",
      note: "Mentioned slight vibration at highway speeds - check alignment next visit.",
      date: "2025-07-08",
    },
  ],
};

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hi! I'm your AI assistant. I can help you with your schedule, parts ordering, and repair status updates. How can I help you today?",
    time: "10:30 AM",
  },
  {
    id: 2,
    role: "user",
    content: "What's my next appointment?",
    time: "10:32 AM",
  },
  {
    id: 3,
    role: "assistant",
    content: "Here's your next appointment:",
    time: "10:32 AM",
    clientData: nextClientData,
  },
];

export default function AIAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [activeRepair, setActiveRepair] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const handleStartRepair = (client) => {
    const startTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const repairStartMessage = {
      id: messages.length + 1,
      role: "assistant",
      content: `🔧 Repair session started for ${client.clientName}'s ${client.carYear} ${client.carModel}. I'm here to help you during this repair. You can ask about parts, procedures, or log updates.`,
      time: startTime,
      isRepairSession: true,
    };
    setMessages((prev) => [...prev, repairStartMessage]);
    setActiveRepair({
      client,
      startTime,
      startMessageId: repairStartMessage.id,
    });
  };

  const handleEndRepair = () => {
    if (!activeRepair) return;
    const endTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const repairEndMessage = {
      id: messages.length + 1,
      role: "assistant",
      content: `✅ Repair session ended for ${activeRepair.client.clientName}. Total duration: ${activeRepair.startTime} - ${endTime}. Great work!`,
      time: endTime,
      isRepairSession: true,
    };
    setMessages((prev) => [...prev, repairEndMessage]);
    setActiveRepair(null);
  };

  const isPartsRequest = (text) => {
    const partsKeywords = [
      "need parts",
      "order parts",
      "get parts",
      "parts for",
      "need a ",
      "need an ",
      "order",
      "brake pads",
      "oil filter",
      "spark plug",
      "battery",
      "filter",
      "belt",
    ];
    const lowerText = text.toLowerCase();
    return (
      activeRepair !== null &&
      partsKeywords.some((keyword) => lowerText.includes(keyword))
    );
  };

  const generatePartsFromRequest = (text) => {
    const mockParts = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes("brake") || lowerText.includes("pad")) {
      mockParts.push({
        id: "1",
        name: "Front Brake Pads Set",
        partNumber: "BP-2022-BMW-F",
        quantity: 1,
        inStock: true,
      });
    }
    if (lowerText.includes("oil") || lowerText.includes("filter")) {
      mockParts.push({
        id: "2",
        name: "Synthetic Oil Filter",
        partNumber: "OF-330i-2022",
        quantity: 1,
        inStock: true,
      });
    }
    if (lowerText.includes("spark") || lowerText.includes("plug")) {
      mockParts.push({
        id: "3",
        name: "Iridium Spark Plugs",
        partNumber: "SP-BMW-IR4",
        quantity: 4,
        inStock: false,
        estimatedDelivery: "Tomorrow, 2:00 PM",
      });
    }
    if (lowerText.includes("battery")) {
      mockParts.push({
        id: "4",
        name: "AGM Car Battery",
        partNumber: "BAT-AGM-80AH",
        quantity: 1,
        inStock: true,
      });
    }
    if (lowerText.includes("belt")) {
      mockParts.push({
        id: "5",
        name: "Serpentine Belt",
        partNumber: "SB-BMW-330",
        quantity: 1,
        inStock: false,
        estimatedDelivery: "Wed, Jan 8",
      });
    }
    if (mockParts.length === 0) {
      mockParts.push({
        id: "6",
        name: "General Repair Part",
        partNumber: "GEN-PART-001",
        quantity: 1,
        inStock: true,
      });
    }
    return mockParts;
  };

  const handlePartsConfirm = (messageId) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const confirmMessage = {
      id: messages.length + 1,
      role: "assistant",
      content:
        "✅ Parts order confirmed! I've added these to the work order. Parts team has been notified.",
      time,
      isRepairSession: true,
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handlePartsCancel = (messageId) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const cancelMessage = {
      id: messages.length + 1,
      role: "assistant",
      content:
        "Parts request cancelled. Let me know if you need anything else.",
      time,
      isRepairSession: true,
    };
    setMessages((prev) => [...prev, cancelMessage]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newUserMessage = {
      id: messages.length + 1,
      role: "user",
      content: inputText,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      isRepairSession: !!activeRepair,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    const userText = inputText;
    setInputText("");
    setIsTyping(true);

    const partsRequested = isPartsRequest(userText);

    setTimeout(() => {
      if (partsRequested) {
        const parts = generatePartsFromRequest(userText);
        const partsMessage = {
          id: messages.length + 2,
          role: "assistant",
          content: "I found these parts for your request. Please confirm:",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          partsData: parts,
          isRepairSession: true,
        };
        setMessages((prev) => [...prev, partsMessage]);
      } else {
        const repairResponses = [
          "I've logged that to the repair notes. Need help with anything else?",
          "Got it! I've updated the repair status. What's next?",
          "Noted. Should I check parts availability for this repair?",
          "Update recorded. Let me know when you're ready for the next step.",
        ];
        const generalResponses = [
          "I've noted that down. Is there anything else you need help with?",
          "Got it! I'll update the system accordingly.",
          "Sure thing! I've processed your request.",
          "Understood. Let me check that for you.",
        ];
        const responses = activeRepair ? repairResponses : generalResponses;
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];
        const newAssistantMessage = {
          id: messages.length + 2,
          role: "assistant",
          content: randomResponse,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          isRepairSession: !!activeRepair,
        };
        setMessages((prev) => [...prev, newAssistantMessage]);
      }
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 70px)" }}>
      {/* Pinned Repair Banner */}
      {activeRepair && (
        <PinnedRepairBanner
          client={activeRepair.client}
          startTime={activeRepair.startTime}
          onEndRepair={handleEndRepair}
        />
      )}

      {/* Chat Messages */}
      <div
        className="overflow-y-auto px-2 py-4 repair-scrollbar"
        style={{ backgroundColor: "hsl(220 20% 8%)" }}
      >
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse",
                message.isRepairSession && "pl-3"
              )}
              style={{
                borderLeft: message.isRepairSession
                  ? "2px solid hsl(43 96% 56% / 0.3)"
                  : "none",
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    message.role === "assistant"
                      ? "hsl(43 96% 56%)"
                      : "hsl(220 15% 18%)",
                  color:
                    message.role === "assistant"
                      ? "hsl(220 20% 8%)"
                      : "hsl(45 10% 95%)",
                }}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === "assistant"
                      ? "rounded-tl-sm"
                      : "rounded-tr-sm"
                  )}
                  style={{
                    backgroundColor:
                      message.role === "assistant"
                        ? message.isRepairSession
                          ? "hsl(43 96% 56% / 0.1)"
                          : "hsl(220 15% 18%)"
                        : "hsl(43 96% 56%)",
                    color:
                      message.role === "assistant"
                        ? "hsl(45 10% 95%)"
                        : "hsl(220 20% 8%)",
                    border:
                      message.isRepairSession && message.role === "assistant"
                        ? "1px solid hsl(43 96% 56% / 0.2)"
                        : "none",
                  }}
                >
                  <p className="whitespace-pre-line text-sm">
                    {message.content}
                  </p>
                  <span
                    className="mt-1 block text-[10px]"
                    style={{
                      color:
                        message.role === "assistant"
                          ? "hsl(220 10% 55%)"
                          : "hsla(43, 96%, 56%, 0.7)",
                    }}
                  >
                    {message.time}
                  </span>
                </div>
                {message.clientData && (
                  <ClientInfoPanel
                    client={message.clientData}
                    onCallCustomer={() => console.log("Calling customer...")}
                    onStartRepair={() => handleStartRepair(message.clientData)}
                  />
                )}
                {message.partsData && (
                  <PartsConfirmationPanel
                    parts={message.partsData}
                    onConfirm={() => handlePartsConfirm(message.id)}
                    onCancel={() => handlePartsCancel(message.id)}
                    onModify={() => console.log("Modify parts...")}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "hsl(43 96% 56%)",
                  color: "hsl(220 20% 8%)",
                }}
              >
                <Bot className="h-4 w-4" />
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ backgroundColor: "hsl(220 15% 18%)" }}
              >
                <div className="flex gap-1">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full"
                    style={{
                      backgroundColor: "hsl(220 10% 55%)",
                      animationDelay: "0ms",
                    }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full"
                    style={{
                      backgroundColor: "hsl(220 10% 55%)",
                      animationDelay: "150ms",
                    }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full"
                    style={{
                      backgroundColor: "hsl(220 10% 55%)",
                      animationDelay: "300ms",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        className="p-4"
        style={{
          borderTop: "1px solid hsl(220 15% 20%)",
          backgroundColor: "hsla(220, 20%, 8%, 0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto max-w-2xl">
          {/* Mode Toggle */}
          <div className="mb-3 flex justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full p-1"
              style={{ backgroundColor: "hsl(220 15% 18%)" }}
            >
              <Button
                variant={!isVoiceMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsVoiceMode(false)}
                className="gap-2 rounded-full px-4"
                style={
                  !isVoiceMode
                    ? {
                        backgroundColor: "hsl(43 96% 56%)",
                        color: "hsl(220 20% 8%)",
                        boxShadow: "0 0 20px hsl(43 96% 56% / 0.3)",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "hsl(45 10% 95%)",
                      }
                }
              >
                <Keyboard className="h-4 w-4" />
                Type
              </Button>
              <Button
                variant={isVoiceMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsVoiceMode(true)}
                className="gap-2 rounded-full px-4"
                style={
                  isVoiceMode
                    ? {
                        backgroundColor: "hsl(43 96% 56%)",
                        color: "hsl(220 20% 8%)",
                        boxShadow: "0 0 20px hsl(43 96% 56% / 0.3)",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "hsl(45 10% 95%)",
                      }
                }
              >
                <Mic className="h-4 w-4" />
                Voice
              </Button>
            </div>
          </div>

          {/* Input */}
          {isVoiceMode ? (
            <div className="flex flex-col items-center py-2">
              <Button
                size="lg"
                onClick={toggleListening}
                className={cn(
                  "h-14 w-14 rounded-full transition-all",
                  isListening && "animate-pulse"
                )}
                style={{
                  backgroundColor: isListening
                    ? "hsl(0 72% 51%)"
                    : "hsl(43 96% 56%)",
                  color: "hsl(0 0% 100%)",
                }}
              >
                {isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              <p className="mt-2 text-xs" style={{ color: "hsl(220 10% 55%)" }}>
                {isListening ? "Listening... Tap to stop" : "Tap to speak"}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
                className="flex-1 rounded-full px-4"
                style={{
                  backgroundColor: "hsl(220 15% 18%)",
                  border: "none",
                  color: "hsl(45 10% 95%)",
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                style={{
                  backgroundColor: inputText.trim()
                    ? "hsl(43 96% 56%)"
                    : "hsl(220 15% 20%)",
                  color: inputText.trim()
                    ? "hsl(220 20% 8%)"
                    : "hsl(220 10% 55%)",
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
