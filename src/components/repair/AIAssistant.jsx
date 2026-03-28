import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Bot, User, Send, Keyboard, Loader2 } from "lucide-react";
import { Button } from "@/components/repair/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/repair/ui/input";
import { ClientInfoPanel } from "@/components/repair/chat/ClientInfoPanel";
import { PinnedRepairBanner } from "@/components/repair/chat/PinnedRepairBanner";
import { PartsConfirmationPanel } from "@/components/repair/chat/PartsConfirmationPanel";
import { Progress } from "@/components/repair/ui/progress";
import { VoiceConfirmationPanel } from "@/components/repair/chat/VoiceConfirmationPanel";
import { toast } from "sonner";

export default function AIAssistant({ messages, setMessages }) {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceConfirmation, setVoiceConfirmation] = useState(null);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeRepair, setActiveRepair] = useState(null);
  const messagesEndRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Helper to sanitize text for DB schema compliance
  const sanitizeText = (text) => {
    if (!text || typeof text !== "string") return "Empty message";

    return (
      text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control chars
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width chars
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim()
        .replace(/[^\x20-\x7E\u0400-\u04FF\u00A0-\u00FF.,!?;:'"()\-]/g, "") // Allow: Latin, Cyrillic, basic punctuation
        .trim() || "Empty message"
    );
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsVoiceProcessing(true);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("model", "whisper-1");

        const res = await fetch("/api/chat/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          setIsVoiceProcessing(false);
          setVoiceConfirmation({
            transcribedText: data.transcription || "No transcription available",
            audioUrl: audioUrl,
          });
        } else {
          toast.error("Failed to transcribe voice message");
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Please allow microphone access to record voice messages");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleVoiceConfirm = async () => {
    if (!voiceConfirmation) return;

    const cleanTranscription = sanitizeText(voiceConfirmation.transcribedText);

    const timestamp = Date.now();
    const transcribedMessage = {
      id: `user-${timestamp}`,
      role: "user",
      content: cleanTranscription,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      isRepairSession: !!activeRepair,
    };

    setMessages((prev) => [...prev, transcribedMessage]);
    setVoiceConfirmation(null);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat/worker_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessages: [cleanTranscription],
          source: "website",
          id: 3,
        }),
      });
      const data = await res.json();

      setIsTyping(false);

      if (data.success) {
        const cleanResponse = sanitizeText(data.response);

        const assistantMessage = {
          id: `assistant-${timestamp}`,
          role: "assistant",
          content: cleanResponse,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          clientData: data.isNextRepair ? data.clientData : null,
          isRepairSession: !!activeRepair,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          id: `error-${timestamp}`,
          role: "assistant",
          content:
            "❌ Sorry, there was an error processing your request. Please try again.",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          isRepairSession: !!activeRepair,
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Voice confirm error:", error);
      setIsTyping(false);

      const errorMessage = {
        id: `error-${timestamp}`,
        role: "assistant",
        content:
          "❌ Network error. Please check your connection and try again.",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        isRepairSession: !!activeRepair,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleVoiceCancel = () => {
    setVoiceConfirmation(null);
  };

  const handleVoiceRetry = () => {
    setVoiceConfirmation(null);
    startRecording();
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const timestamp = Date.now();
    const newUserMessage = {
      id: `user-${timestamp}`,
      role: "user",
      content: inputText,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      isRepairSession: !!activeRepair,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat/worker_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessages: [inputText],
          source: "website",
          id: 3,
        }),
      });
      const data = await res.json();

      /* const partsRequested = isPartsRequest(userText);
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
    }, 1500); */

      setIsTyping(false);

      if (data.success) {
        let assistantMessage;

        if (data.clientData != null) {
          assistantMessage = {
            id: `assistant-${timestamp}`,
            role: "assistant",
            content: data.response,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            clientData: data.clientData || null,
            isRepairSession: !!activeRepair,
          };
        } else {
          assistantMessage = {
            id: `assistant-${timestamp}`,
            role: "assistant",
            content: data.response,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            isRepairSession: !!activeRepair,
          };
        }

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          id: `error-${timestamp}`,
          role: "assistant",
          content:
            "❌ Sorry, there was an error processing your request. Please try again.",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          isRepairSession: !!activeRepair,
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Send message error:", error);
      setIsTyping(false);

      const errorMessage = {
        id: `error-${timestamp}`,
        role: "assistant",
        content:
          "❌ Network error. Please check your connection and try again.",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        isRepairSession: !!activeRepair,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      {/* Pinned Repair Banner */}
      {activeRepair && (
        <PinnedRepairBanner
          client={activeRepair.client}
          startTime={activeRepair.startTime}
          onEndRepair={handleEndRepair}
        />
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto repair-scrollbar px-2 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse",
                message.isRepairSession &&
                  "pl-3 border-l-2 border-[hsl(43_96%_56%)]",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "assistant"
                    ? "bg-[hsl(43_96%_56%)] text-[hsl(220_20%_8%)]"
                    : "bg-[hsl(220_15%_18%)] text-[hsl(45_10%_95%)]",
                )}
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
                      ? "bg-[hsl(220_15%_18%)] text-[hsl(45_10%_95%)] rounded-tl-sm"
                      : "bg-[hsl(43_96%_56%)] text-[hsl(220_20%_8%)] rounded-tr-sm",
                    message.isRepairSession &&
                      message.role === "assistant" &&
                      "bg-[hsla(43,96%,56%,0.1)] border border-[hsla(43,96%,56%,0.2)]",
                  )}
                >
                  <p className="whitespace-pre-line text-sm">
                    {message.content}
                  </p>
                  <span
                    className={cn(
                      "mt-1 block text-[10px]",
                      message.role === "assistant"
                        ? "text-[hsl(220_10%_55%)]"
                        : "text-[hsl(220_20%_8%)]/70",
                    )}
                  >
                    {message.time}
                  </span>
                </div>

                {message.clientData && (
                  <ClientInfoPanel
                    client={message.clientData}
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(43_96%_56%)] text-[hsl(220_20%_8%)]">
                <Bot className="h-4 w-4" />
              </div>

              <div className="rounded-2xl rounded-tl-sm bg-[hsl(220_15%_18%)] px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-[hsl(220_10%_55%)]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-[hsl(220_10%_55%)]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-[hsl(220_10%_55%)]"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[hsl(220_15%_20%)] bg-[hsl(220_20%_8%)]/80 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-2xl">
          {/* Mode Toggle */}
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-[hsl(220_15%_18%)] p-1">
              <Button
                variant={!isVoiceMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsVoiceMode(false)}
                className="gap-2 rounded-full px-4"
              >
                <Keyboard className="h-4 w-4" />
                Type
              </Button>
              <Button
                variant={isVoiceMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsVoiceMode(true)}
                className="gap-2 rounded-full px-4"
              >
                <Mic className="h-4 w-4" />
                Voice
              </Button>
            </div>
          </div>

          {/* Input */}
          {isVoiceMode ? (
            <div className="flex flex-col items-center py-2">
              {voiceConfirmation && (
                <VoiceConfirmationPanel
                  transcribedText={voiceConfirmation.transcribedText}
                  audioUrl={voiceConfirmation.audioUrl}
                  onConfirm={handleVoiceConfirm}
                  onCancel={handleVoiceCancel}
                  onRetry={handleVoiceRetry}
                />
              )}

              {isVoiceProcessing && !voiceConfirmation && (
                <div className="mb-4 w-full max-w-xs">
                  <div className="flex items-center justify-center gap-2 rounded-full bg-[hsla(43,96%,56%,0.1)] px-4 py-2 text-sm text-[hsl(43_96%_56%)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing voice...</span>
                  </div>
                  <Progress value={66} className="mt-2 h-1" />
                </div>
              )}

              {!voiceConfirmation && (
                <>
                  <Button
                    variant={isListening ? "destructive" : "default"}
                    size="lg"
                    onClick={toggleListening}
                    disabled={isVoiceProcessing}
                    className={cn(
                      "h-14 w-14 rounded-full transition-all",
                      isListening && "animate-pulse",
                      isVoiceProcessing && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {isVoiceProcessing ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isListening ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>

                  <p className="mt-2 text-xs text-[hsl(220_10%_55%)]">
                    {isVoiceProcessing
                      ? "Converting speech to text..."
                      : isListening
                        ? "Listening... Tap to stop"
                        : "Tap to speak"}
                  </p>
                </>
              )}
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
                className="flex-1 rounded-full bg-[hsl(220_15%_18%)] text-white border-0 px-4"
              />

              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
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
