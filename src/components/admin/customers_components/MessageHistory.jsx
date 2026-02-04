"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, User, Bot, ArrowDown } from "lucide-react";
import { Input } from "@/components/admin/ui/customers/input";
import { Button } from "@/components/admin/ui/customers/button";
import { motion } from "framer-motion";

export const MessageHistory = ({ chatId, messages, setMessages }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll when new messages arrive AND we're near bottom
  useEffect(() => {
    if (messages.length > 0) {
      const container = chatContainerRef.current;
      if (!container) return;

      // Check if user is near bottom (within 150px)
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 150;

      if (isNearBottom) {
        scrollToBottom();
      } else {
        // Show scroll button if user is scrolled up
        setShowScrollButton(true);
      }
    }
  }, [messages]);

  // Track manual scroll position
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 150;

      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

    setShowScrollButton(false);
  };

  const handleSend = async () => {
    if (newMessage.trim()) {
      const response = await fetch("/api/chat/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage, chatId: chatId }),
      });
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { content: newMessage, sender: "shop", timestamp: Date.now() },
      ]);
      setNewMessage("");

      console.log("Message Sent: ", data);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="glass-card rounded-xl overflow-hidden animate-fade-in"
      style={{
        background: "hsl(222 40% 9%)",
        border: "1px solid hsl(222 30% 18%)",
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center gap-2"
        style={{
          borderBottom: "1px solid hsl(222 30% 18%)",
          color: "hsl(40 20% 95%)",
        }}
      >
        <MessageCircle className="w-5 h-5 text-[hsl(43_96%_56%)]" />
        <h3 className="font-semibold">Message History</h3>
        <span className="ml-auto text-xs text-[hsl(220_15%_55%)]">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div
        className="h-80 overflow-y-auto p-4 space-y-4"
        style={{ color: "hsl(40 20% 95%)" }}
        ref={chatContainerRef}
      >
        {messages.length === 0 ? (
          <div
            className="flex items-center justify-center h-full text-sm"
            style={{ color: "hsl(220 15% 55%)" }}
          >
            No messages yet
          </div>
        ) : (
          messages.map((message, index) => {
            // Sender-based colors
            let avatarBg, avatarColor, messageBg;
            if (message.sender === "customer") {
              avatarBg = "hsl(199 89% 48% / 0.2)"; // info/20
              avatarColor = "hsl(199 89% 48%)"; // info
              messageBg = "hsl(222 30% 14%)"; // secondary
            } else if (message.sender === "shop") {
              avatarBg = "hsl(43 96% 56% / 0.2)"; // primary/20
              avatarColor = "hsl(43 96% 56%)"; // primary
              messageBg = "hsl(43 96% 56% / 0.1)"; // primary/10
            } else {
              // system
              avatarBg = "hsl(222 30% 14%)";
              avatarColor = "hsl(220 15% 55%)";
              messageBg = "hsl(222 30% 14% / 0.5)";
            }

            return (
              <div
                key={index}
                className={`flex gap-3 animate-slide-up ${
                  message.sender === "shop" ? "flex-row-reverse" : ""
                }`}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: avatarBg,
                    color: avatarColor,
                  }}
                >
                  {message.sender === "customer" ? (
                    <User className="w-4 h-4" />
                  ) : message.sender === "shop" ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className="max-w-[75%] rounded-xl px-4 py-2"
                  style={{
                    backgroundColor: messageBg,
                    ...(message.sender === "system" && {
                      border: "1px solid hsl(222 30% 18%)",
                    }),
                  }}
                >
                  <p className="text-sm" style={{ color: "hsl(40 20% 95%)" }}>
                    {message.content}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "hsl(220 15% 55%)" }}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-4" />

        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[7%] right-[5%] z-20"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={scrollToBottom}
              className="rounded-full shadow-md hover:shadow-lg transition-shadow backdrop-blur-md"
              aria-label="Scroll to latest message"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4" style={{ borderTop: "1px solid hsl(222 30% 18%)" }}>
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            style={{
              backgroundColor: "hsl(222 47% 6%)",
              border: "1px solid hsl(222 30% 18%)",
              color: "hsl(40 20% 95%)",
              placeholder: { color: "hsl(220 15% 55%)" },
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-[hsl(43_96%_56%)] hover:bg-[hsl(43_96%_50%)] text-[hsl(222_47%_6%)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageHistory;
