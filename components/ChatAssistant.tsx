"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi Doctor, I'm ConsentGen AI. How can I help you with medico-legal or procedural questions today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.filter(m => m.role !== "system") }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages([...newMessages, data]);
    } catch (error) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-nq-purple/30 text-white transition-transform hover:scale-110 z-50"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "auto" : "500px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 w-[90vw] sm:w-[400px] bg-white border border-nq-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 font-inter ${
              isMinimized ? "" : "max-h-[80vh]"
            }`}
          >
            {/* Header */}
            <div 
              className="p-4 border-b border-nq-border flex items-center justify-between cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5" />
                <span className="font-bold tracking-tight">ConsentGen AI</span>
              </div>
              <div className="flex items-center gap-1 text-white/80">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                  className="p-1 hover:text-white transition-colors hover:bg-white/10 rounded"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
                  className="p-1 hover:text-white transition-colors hover:bg-white/10 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === "user" 
                            ? "bg-nq-purple text-white rounded-br-sm shadow-sm" 
                            : "bg-white border border-nq-border text-nq-text rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-nq-text">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-nq-border rounded-bl-sm shadow-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-nq-purple/40 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-nq-purple/40 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-nq-purple/40 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-nq-border bg-white">
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask a medical or legal question..."
                      className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-nq-border bg-slate-50 px-3 py-2.5 text-sm text-nq-text outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="w-11 h-11 shrink-0 rounded-xl bg-nq-purple text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors shadow-sm shadow-nq-purple/20"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                  <div className="text-[10px] text-center text-nq-text-light mt-2 font-medium">
                    ConsentGen AI can make mistakes. Verify critical information.
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
