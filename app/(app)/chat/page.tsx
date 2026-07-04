"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChatCircleText, PaperPlaneRight, CircleNotch, Plus, ChatCircle, Trash, List, X,
  Gavel, FirstAid, FileText, ShieldCheck, Copy, Check,
} from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

const DEFAULT_MESSAGE: Message = {
  role: "assistant",
  content: "Hi Doctor, I'm ConsentGen AI. How can I help you with medico-legal or procedural questions today?"
};

const SUGGESTED_PROMPTS = [
  {
    icon: Gavel,
    title: "Consent law basics",
    prompt: "What are the essential elements of valid informed consent under Indian law?",
  },
  {
    icon: FirstAid,
    title: "Emergency treatment",
    prompt: "Can I treat an unconscious road accident victim without consent? What does BNS Section 29 say?",
  },
  {
    icon: FileText,
    title: "Minor patients",
    prompt: "Who can give consent for a surgical procedure on a 15-year-old patient?",
  },
  {
    icon: ShieldCheck,
    title: "Telemedicine rules",
    prompt: "What consent requirements apply to telemedicine consultations under the 2020 guidelines?",
  },
];

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("consentgen_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setActiveSessionId(parsed[0].id);
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("consentgen_chat_history", JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [DEFAULT_MESSAGE];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (activeSessionId === id) {
      setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const currentMessages = [...messages, userMessage];

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      currentSessionId = uuidv4();
      const newSession: ChatSession = {
        id: currentSessionId,
        title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : ""),
        date: new Date().toISOString(),
        messages: [DEFAULT_MESSAGE, userMessage]
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, messages: currentMessages } : s
      ));
    }

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages.filter(m => m.role !== "system") }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, messages: [...s.messages, data] } : s
      ));
    } catch (error) {
      const errorMessage: Message = { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." };
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleCopyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const isNewChat = !activeSession;

  return (
    <div
      className="flex-1 flex w-full font-body overflow-hidden relative"
      style={{ backgroundColor: "#ededed" }}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Chat History Sidebar */}
      <aside
        className={`absolute md:static top-0 left-0 h-full w-72 flex flex-col transition-transform duration-300 z-50 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-bold tracking-tight" style={{ color: "#0b0f1a" }}>Chat History</h2>
          <button className="md:hidden p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-all" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-all"
            style={{ backgroundColor: "#0b0f1a", color: "#fff" }}
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-xs text-neutral-400 mt-10 px-4">
              No previous chats found.
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? "bg-neutral-100 text-neutral-800"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <ChatCircle className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate block">{session.title}</span>
                    <span className="text-[10px] text-neutral-400">{relativeDate(session.date)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Chat header */}
        <header
          className="px-5 py-4 flex items-center gap-3 shrink-0"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <button
            className="md:hidden p-2 -ml-1 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-all"
            onClick={() => setIsSidebarOpen(true)}
          >
            <List className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0b0f1a" }}>
              <ChatCircleText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: "#0b0f1a" }}>
                ConsentGen <span className="font-serif italic font-normal text-neutral-655 font-instrument" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>assistant</span>
              </h1>
              <p className="text-xs text-neutral-400 hidden md:block">Medical law and procedure assistant</p>
            </div>
          </div>
        </header>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5" style={{ backgroundColor: "#ededed" }}>
          {isNewChat ? (
            /* Welcome / empty state */
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: "#0b0f1a" }}>
                <ChatCircleText weight="duotone" className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2 text-center" style={{ color: "#0b0f1a" }}>
                How can I help,{" "}
                <span className="font-serif italic font-normal text-neutral-600" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Doctor?
                </span>
              </h2>
              <p className="text-sm text-neutral-500 text-center mb-8 max-w-sm">
                Ask about consent law, medico-legal documentation, NMC regulations, or clinical procedures in India.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map(({ icon: Icon, title, prompt }) => (
                  <button
                    key={title}
                    onClick={() => sendMessage(prompt)}
                    className="text-left p-4 rounded-2xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center mb-2.5 group-hover:bg-neutral-900 transition-colors">
                      <Icon weight="duotone" className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#0b0f1a" }}>{title}</p>
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <div className="max-w-3xl mx-auto w-full space-y-5">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-3 mt-0.5"
                    style={{ backgroundColor: "#0b0f1a" }}>
                    <ChatCircleText className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`group relative max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "" : "min-w-0"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm shadow-sm"
                        : "bg-white text-neutral-800 rounded-bl-sm shadow-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? { backgroundColor: "#0b0f1a" }
                        : { border: "1px solid rgba(0,0,0,0.07)" }
                    }
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-neutral-900 text-neutral-700">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "assistant" && idx > 0 && (
                    <button
                      onClick={() => handleCopyMessage(msg.content, idx)}
                      title="Copy response"
                      className="absolute -bottom-1 right-2 translate-y-full opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-400 hover:text-neutral-700 hover:bg-white transition-all"
                    >
                      {copiedIdx === idx
                        ? <><Check weight="bold" className="w-3 h-3 text-green-600" /> Copied</>
                        : <><Copy weight="regular" className="w-3 h-3" /> Copy</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-3 mt-0.5"
                  style={{ backgroundColor: "#0b0f1a" }}>
                  <ChatCircleText className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white shadow-sm flex items-center gap-1.5"
                  style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          )}
        </div>

        {/* Input Area */}
        <div
          className="p-4 shrink-0"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <form onSubmit={handleSend} className="flex items-end gap-3 max-w-3xl mx-auto">
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
              className="flex-1 max-h-32 min-h-[48px] resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all text-neutral-800 placeholder-neutral-400 bg-neutral-100"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 shrink-0 rounded-2xl text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#0b0f1a" }}
            >
              {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneRight className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[11px] text-center text-neutral-400 mt-2.5">
            ConsentGen AI can make mistakes. Verify critical information.
          </p>
        </div>
      </main>
    </div>
  );
}
