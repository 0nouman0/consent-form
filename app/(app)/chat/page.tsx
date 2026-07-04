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
      style={{ backgroundColor: "var(--paper)" }}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(23,20,16,0.25)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Chat History Sidebar */}
      <aside
        className={`absolute md:static top-0 left-0 h-full w-72 flex flex-col transition-transform duration-300 z-50 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{
          backgroundColor: "var(--sheet)",
          borderRight: "1px solid var(--rule)",
        }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--rule)" }}>
          <h2 className="font-serif text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>Chat History</h2>
          <button
            className="md:hidden p-1.5 rounded-md transition-all text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-xs mt-10 px-4" style={{ color: "var(--ink-muted)" }}>
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
                className={`group flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? "bg-[var(--paper)] text-[var(--ink)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <ChatCircle className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate block">{session.title}</span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--ink-muted)" }}>{relativeDate(session.date)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 transition-all text-[var(--ink-muted)] hover:text-[var(--red)]"
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
            backgroundColor: "var(--sheet)",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <button
            className="md:hidden p-2 -ml-1 rounded-md transition-all text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <List className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--ink)" }}>
              <ChatCircleText className="w-4 h-4" style={{ color: "var(--sheet)" }} />
            </div>
            <div>
              <h1 className="font-serif text-sm font-semibold" style={{ color: "var(--ink)" }}>
                ConsentGen <span className="font-serif font-semibold" style={{ color: "var(--red)" }}>assistant</span>
              </h1>
              <p className="text-xs hidden md:block" style={{ color: "var(--ink-muted)" }}>Medical law and procedure assistant</p>
            </div>
          </div>
        </header>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5" style={{ backgroundColor: "var(--paper)" }}>
          {isNewChat ? (
            /* Welcome / empty state */
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
              <div className="w-14 h-14 rounded-md flex items-center justify-center mb-5"
                style={{ backgroundColor: "var(--ink)" }}>
                <ChatCircleText weight="duotone" className="w-7 h-7" style={{ color: "var(--sheet)" }} />
              </div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight mb-2 text-center" style={{ color: "var(--ink)" }}>
                How can I help,{" "}
                <span style={{ color: "var(--red)" }}>
                  Doctor?
                </span>
              </h2>
              <p className="text-sm text-center mb-8 max-w-sm" style={{ color: "var(--ink-muted)" }}>
                Ask about consent law, medico-legal documentation, NMC regulations, or clinical procedures in India.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map(({ icon: Icon, title, prompt }) => (
                  <button
                    key={title}
                    onClick={() => sendMessage(prompt)}
                    className="text-left p-4 rounded-md hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(23,20,16,0.06)] transition-all group"
                    style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2.5 transition-colors bg-[var(--paper)] group-hover:bg-[var(--ink)]">
                      <Icon weight="duotone" className="w-4 h-4 transition-colors text-[var(--ink-muted)] group-hover:text-[var(--sheet)]" />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>{title}</p>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--ink-muted)" }}>{prompt}</p>
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
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mr-3 mt-0.5"
                    style={{ backgroundColor: "var(--ink)" }}>
                    <ChatCircleText className="w-3.5 h-3.5" style={{ color: "var(--sheet)" }} />
                  </div>
                )}
                <div className={`group relative max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "" : "min-w-0"}`}>
                  <div
                    className={`rounded-md px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "rounded-br-sm"
                        : "rounded-bl-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? { backgroundColor: "var(--ink)", color: "var(--sheet)" }
                        : { backgroundColor: "var(--sheet)", color: "var(--ink-soft)", border: "1px solid var(--rule)" }
                    }
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-[var(--ink)] text-[var(--ink-soft)]">
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
                      className="absolute -bottom-1 right-2 translate-y-full opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--sheet)]"
                    >
                      {copiedIdx === idx
                        ? <><Check weight="bold" className="w-3 h-3" style={{ color: "#3f7a4e" }} /> Copied</>
                        : <><Copy weight="regular" className="w-3 h-3" /> Copy</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mr-3 mt-0.5"
                  style={{ backgroundColor: "var(--ink)" }}>
                  <ChatCircleText className="w-3.5 h-3.5" style={{ color: "var(--sheet)" }} />
                </div>
                <div className="rounded-md px-4 py-3 flex items-center gap-1.5"
                  style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}>
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--ink-muted)", animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--ink-muted)", animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--ink-muted)", animationDelay: "300ms" }} />
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
            backgroundColor: "var(--sheet)",
            borderTop: "1px solid var(--rule)",
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
              className="flex-1 max-h-32 min-h-[48px] resize-none rounded-md px-4 py-3 text-sm outline-none transition-all border border-[var(--rule)] focus:border-[var(--ink)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] bg-[var(--paper)] focus:bg-[var(--sheet)]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 shrink-0 rounded-md flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
            >
              {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneRight className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[11px] text-center mt-2.5" style={{ color: "var(--ink-muted)" }}>
            ConsentGen AI can make mistakes. Verify critical information.
          </p>
        </div>
      </main>
    </div>
  );
}
