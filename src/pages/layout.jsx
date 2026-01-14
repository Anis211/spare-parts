import Navbar from "@/components/Navbar";
import Footer from "@/components/account/AccountFooter";
import useUser from "@/zustand/user";
import { AnimatePresence, motion } from "motion/react";
import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { ImageDown, BadgeX } from "lucide-react";

export default function Layout({ children }) {
  const router = useRouter();
  const user = useUser((state) => state.user);

  const chatId = useUser((state) => state.chatId);
  const setChatId = useUser((state) => state.setChatId);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    { isUser: false, text: "How can I help you today?" },
  ]);
  const [message, setMessage] = useState("");
  const [pendingMessages, setPendingMessages] = useState([]);
  const [messageImages, setMessageImages] = useState([]);

  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);
  const pendingRef = useRef([]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    console.log("e.target.files: ", e.target.files);
    console.log("message Images: ", messageImages);
    console.log("files: ", files);

    setMessageImages((prev) => [...prev, ...files]);
  };

  const toggleChat = async () => {
    setIsChatOpen(!isChatOpen);

    if (messages.length <= 1 && chatId.length > 0) {
      try {
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: chatId }),
        });
        const data = await response.json();

        console.log(data);

        if (data.chat) {
          setMessages((prev) => [
            ...prev,
            ...data.chat.map((msg) => ({
              isUser: msg.metadata.role === "user",
              text: msg.text,
            })),
          ]);
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    } else {
      const newChatId = Math.floor(100000 + Math.random() * 900000).toString();
      setChatId(newChatId);
    }
  };

  const flushPendingMessages = async (lastImagesBase64) => {
    const toSend = pendingRef.current;
    if (!toSend || toSend.length === 0) return;

    // Clear buffer **before** sending
    pendingRef.current = [];
    setPendingMessages([]);

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat/user-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessages: toSend,
          userImages: lastImagesBase64 || [],
          source: "chat",
          chatId: chatId,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API ${response.status}: ${err}`);
      }

      const answer = await response.json();

      // Show assistant reply in chat
      setMessages((prev) => [
        ...prev,
        { isUser: false, text: answer.response },
      ]);
    } catch (err) {
      console.error("flushPendingMessages error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (message.trim() === "" && (!messageImages || messageImages.length === 0))
      return;

    console.log("Sending message:", message);
    console.log("With images:", messageImages);

    let imagesBase64 = [];

    try {
      // --- 1. Convert files to base64 and upload them ---
      const fileToDataURL = (file) =>
        new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(file);
        });

      const files = (messageImages || []).flatMap((x) =>
        x instanceof FileList ? Array.from(x) : [x]
      );

      imagesBase64 = await Promise.all(files.map(fileToDataURL));

      let imageUrls = [];
      if (imagesBase64.length > 0) {
        const uploadRes = await fetch("/api/images/bulk-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: imagesBase64 }),
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(
            `Image upload failed ${uploadRes.status}: ${errText}`
          );
        }

        const { urls } = await uploadRes.json();
        imageUrls = urls || [];
        setMessageImages([]); // clear selected images after successful upload
      }

      // --- 2. Build the final user message text ---
      const finalMessage =
        imageUrls.length > 0
          ? `${message} images: [${imageUrls.join(", ")}]`
          : message;

      // Immediately show user message in chat
      setMessages((prev) => [
        ...prev,
        {
          text: finalMessage,
          isUser: true,
        },
      ]);

      // Add to pending buffer
      setPendingMessages((prev) => {
        const updated = [...prev, finalMessage];
        pendingRef.current = updated;
        return updated;
      });

      // Clear input
      setMessage("");

      // --- 3. Debounce: wait a bit for more user messages ---
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        flushPendingMessages(imagesBase64);
      }, 2500);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-[100vh] bg-[hsl(222_47%_6%)]">
      {!router.asPath.includes("/admin") &&
        !router.asPath.includes("/repair") && <Navbar />}

      {children}

      {!router.asPath.includes("/admin") &&
        !router.asPath.includes("/repair") &&
        !router.asPath.includes("/sign-in") && (
          <div className="fixed bottom-6 right-6">
            <AnimatePresence>
              {isChatOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="bg-gradient-to-r from-[#0C1F54]/90 to-[#040E26]/90 backdrop-blur-md text-black rounded-lg shadow-xl w-[30vw] transition-all duration-300 ease-in-out"
                >
                  <div className="bg-yellow-400 p-4 flex justify-between items-center rounded-t-md">
                    <h3 className="font-bold text-black">Chat with us</h3>
                    <button
                      onClick={toggleChat}
                      className="text-black hover:text-gray-800 cursor-pointer"
                    >
                      <img src="/close.png" rel="chat" className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="h-80 p-4 overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                      {messages.map((msg, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 60 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 60 }}
                          transition={{ duration: 0.6, type: "spring" }}
                          key={index}
                          className={`mb-3 ${
                            msg.isUser ? "text-right" : "text-left"
                          }`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg ${
                              msg.isUser
                                ? "bg-yellow-400/80 text-black"
                                : "bg-gray-200/80 text-black"
                            }`}
                          >
                            <pre className="md:max-w-[25.5vw] whitespace-pre-line break-words max-w-full text-sm md:text-base">
                              {(() => {
                                // ✅ Safely ensure text exists
                                const text =
                                  typeof msg.text === "string" ? msg.text : "";

                                // ✅ 1. Detect images array pattern
                                const imageMatch = text.match(
                                  /images:\s*\[([^\]]+)\]/
                                );
                                if (imageMatch) {
                                  // Extract all URLs or paths inside the array
                                  const imageUrls = imageMatch[1]
                                    .split(/['",\s]+/)
                                    .filter((s) => s.startsWith("http"));

                                  const before = text.split(imageMatch[0])[0];
                                  const after =
                                    text.split(imageMatch[0])[1] || "";

                                  return (
                                    <>
                                      {before}
                                      <div className="my-2 flex flex-row flex-wrap gap-2">
                                        {imageUrls.map((url, idx) => (
                                          <img
                                            key={idx}
                                            src={url}
                                            alt="Attached"
                                            className="max-w-[200px] rounded-lg border border-gray-300"
                                          />
                                        ))}
                                      </div>
                                      {after}
                                    </>
                                  );
                                }

                                // ✅ 2. Handle Markdown-style links [label](http://...)
                                const markdownMatch = text.match(
                                  /\[.*?\]\((https?:\/\/[^\s)]+)\)/
                                );
                                if (markdownMatch) {
                                  const link = markdownMatch[1];
                                  const parts = text.split(markdownMatch[0]);
                                  return (
                                    <>
                                      {parts[0]}
                                      <a
                                        href={link}
                                        className="text-blue-600 underline break-all"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {link}
                                      </a>
                                      {parts[1]}
                                    </>
                                  );
                                }

                                // ✅ 3. Handle plain URLs like http://localhost:3000/details/002
                                const linkMatch = text.match(/https?:\/\/\S+/);
                                if (linkMatch) {
                                  const link = linkMatch[0];
                                  const parts = text.split(link);
                                  return (
                                    <>
                                      {parts[0]}
                                      <a
                                        href={link}
                                        className="text-blue-600 underline break-all"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {link}
                                      </a>
                                      {parts[1]}
                                    </>
                                  );
                                }

                                // ✅ 4. Otherwise just render plain text
                                return text;
                              })()}
                            </pre>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 60 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 60 }}
                          transition={{ duration: 0.6, type: "spring" }}
                          className={`mb-3 justify-left`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg bg-gray-200/80 text-black pr-5 pb-6`}
                          >
                            <motion.div className="loader" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <form
                    onSubmit={(e) => sendMessage(e)}
                    className="p-4 border-t border-gray-200"
                  >
                    <div className="flex">
                      <AnimatePresence>
                        {messageImages.map((img, idx) => (
                          <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.4, type: "spring" }}
                            key={idx}
                            className="absolute bottom-[4vw] bg-gray-500 rounded-lg w-20 h-20 mr-2"
                          >
                            <img
                              src={img.name ? URL.createObjectURL(img) : ""}
                              alt="preview"
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <BadgeX
                              onClick={() => {
                                setMessageImages((prev) => [
                                  ...prev.slice(0, idx),
                                  ...prev.slice(idx + 1, prev.length),
                                ]);
                                console.log([
                                  ...messageImages.slice(0, idx),
                                  ...messageImages.slice(
                                    idx + 1,
                                    messageImages.length
                                  ),
                                ]);
                              }}
                              className="w-4 h-4 absolute bottom-15.5 left-15.5"
                            />
                          </motion.div>
                        ))}{" "}
                      </AnimatePresence>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 text-gray-300 rounded-l-lg focus:outline-none focus:border-yellow-400"
                      />

                      <motion.button
                        whileHover={{
                          backgroundColor: "white",
                          color: "#040E26",
                          transition: { duration: 0.6, type: "spring" },
                        }}
                        type="button"
                        onClick={handleButtonClick}
                        className="text-gray-300 my-auto border border-gray-300 p-2 !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <ImageDown className="w-6 h-6" />
                      </motion.button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <button
                        type="submit"
                        disabled={isLoading || message.trim() === ""}
                        className="bg-yellow-400 disabled:opacity-75 text-black p-2 rounded-r-lg hover:bg-yellow-500 transition-colors !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <img src="/send.png" rel="chat" className="w-6 h-6" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <button
                  onClick={toggleChat}
                  className="bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors cursor-pointer"
                >
                  <img src="/chat.png" rel="chat" className="w-8 h-8" />
                </button>
              )}
            </AnimatePresence>
          </div>
        )}

      {!router.asPath.includes("/admin") &&
        !router.asPath.includes("/repair") && <Footer />}
    </div>
  );
}
