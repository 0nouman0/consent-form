"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Loader2,
  Plus,
  Trash2,
  Menu,
  X,
  Copy,
  Check,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  content: "How can I help with medico-legal or procedural questions today, Doctor?",
};

const SUGGESTED_PROMPTS = [
  {
    title: "Consent law basics",
    prompt: "What are the essential elements of valid informed consent under Indian law?",
  },
  {
    title: "Emergency treatment",
    prompt: "Can I treat an unconscious road accident victim without consent? What does BNS Section 29 say?",
  },
  {
    title: "Minor patients",
    prompt: "Who can give consent for a surgical procedure on a 15-year-old patient?",
  },
  {
    title: "Telemedicine rules",
    prompt: "What consent requirements apply to telemedicine consultations under the 2020 guidelines?",
  },
];

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function repairMarkdown(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/\|\s*\|\s*\|/g, "|\n|");
  s = s.replace(/\|\s{2,}\|/g, "|\n|");
  s = s.replace(/(\|[^|]+\|)(\s*\|[-: ]+\|)/g, "$1\n$2");
  s = s.replace(/(\|[-: ]+\|)(\s*\|[^|]+\|)/g, "$1\n$2");
  s = s.replace(/([^\n])(\n\|)/g, "$1\n\n|");
  s = s.replace(/([^\n])(\n#{1,4} )/g, "$1\n\n$2");
  return s;
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
      } catch {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("consentgen_chat_history", JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [DEFAULT_MESSAGE];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
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
        title: userMessage.content.slice(0, 44) + (userMessage.content.length > 44 ? "…" : ""),
        date: new Date().toISOString(),
        messages: [DEFAULT_MESSAGE, userMessage],
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: currentMessages } : s
        )
      );
    }

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages.filter((m) => m.role !== "system") }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [...s.messages, data] } : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { role: "assistant", content: "Unable to reach the assistant right now. Please try again." },
                ],
              }
            : s
        )
      );
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

  const mdComponents = {
    h1: ({ children }: any) => (
      <h1 className="font-serif text-base font-semibold text-[var(--ink)] mt-5 mb-2 pb-1.5 border-b border-[var(--rule)]">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="font-serif text-[15px] font-semibold text-[var(--ink)] mt-4 mb-1.5 pb-1 border-b border-[var(--rule)]">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-[13.5px] font-semibold text-[var(--ink)] mt-3.5 mb-1">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-[13px] font-semibold text-[var(--ink)] mt-2.5 mb-1">
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-[14px] leading-[1.7] my-2 text-[var(--ink-soft)]">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-5 my-2.5 space-y-1.5 marker:text-[var(--ink-muted)]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-5 my-2.5 space-y-1.5 marker:font-medium marker:text-[var(--ink-muted)]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[14px] leading-[1.65] text-[var(--ink-soft)] pl-0.5">
        {children}
      </li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-[var(--ink)]">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-[var(--ink-soft)]">{children}</em>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="my-3 pl-3.5 py-0.5 border-l-2 border-[var(--rule)] text-[13.5px] text-[var(--ink-muted)] leading-relaxed">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--rule)] font-mono text-[12px] text-[var(--ink)]">
        {children}
      </code>
    ),
    hr: () => <hr className="my-4 border-[var(--rule)]" />,
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto rounded border border-[var(--rule)] bg-[var(--sheet)]">
        <table className="w-full border-collapse text-left text-[13px] min-w-[460px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-[var(--rule)]">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="even:bg-[rgba(23,20,16,0.015)]">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-3.5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3.5 py-2.5 align-top text-[var(--ink-soft)] leading-relaxed text-[13px]">
        {children}
      </td>
    ),
  };

  return (
    <div
      className="flex-1 flex w-full font-body overflow-hidden relative"
      style={{ backgroundColor: "var(--sheet)" }}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(23,20,16,0.25)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── History Sidebar ── */}
      <aside
        className={`absolute md:static top-0 left-0 h-full w-64 flex flex-col transition-transform duration-200 z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: "var(--paper)", borderRight: "1px solid var(--rule)" }}
      >
        <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--rule)" }}>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-muted)" }}>
            Conversations
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleNewChat}
              title="New conversation"
              className="p-1.5 rounded transition-colors text-[var(--ink)] hover:bg-[var(--sheet)]"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="md:hidden p-1.5 rounded transition-colors text-[var(--ink-muted)] hover:text-[var(--ink)]"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-xs px-3 py-8 text-center" style={{ color: "var(--ink-muted)" }}>
              No conversations yet.
            </p>
          ) : (
            sessions.map((session) => {
              const active = activeSessionId === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--sheet)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--sheet)]/60 hover:text-[var(--ink)]"
                  }`}
                  style={active ? { border: "1px solid var(--rule)" } : { border: "1px solid transparent" }}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[12.5px] font-medium truncate">{session.title}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                      {relativeDate(session.date)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity text-[var(--ink-muted)] hover:text-[var(--red)]"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main Thread Area ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Compact bar on mobile / active thread title */}
        <div
          className="px-4 sm:px-6 py-3 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid var(--rule)", backgroundColor: "var(--sheet)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              className="md:hidden p-1.5 -ml-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium truncate" style={{ color: "var(--ink-soft)" }}>
              {activeSession ? activeSession.title : "Medico-Legal Assistant"}
            </span>
          </div>
          {activeSession && (
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded transition-colors hover:bg-[var(--paper)]"
              style={{ color: "var(--ink-muted)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {isNewChat ? (
            <div className="h-full flex flex-col justify-center max-w-2xl mx-auto">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] mb-2" style={{ color: "var(--red)" }}>
                Medico-Legal Desk
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight mb-2" style={{ color: "var(--ink)" }}>
                Ask about Indian medical law &amp; consent.
              </h2>
              <p className="text-sm mb-8" style={{ color: "var(--ink-muted)" }}>
                Guidance grounded in BNS §§24–30, IMC 2002, NMC 2023, and PM RAHAT 2025.
              </p>

              <div className="divide-y rounded-md border overflow-hidden" style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper)" }}>
                {SUGGESTED_PROMPTS.map(({ title, prompt }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-[var(--sheet)] group"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block mb-0.5" style={{ color: "var(--ink)" }}>
                        {title}
                      </span>
                      <span className="text-xs block truncate" style={{ color: "var(--ink-muted)" }}>
                        {prompt}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--ink-muted)" }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.slice(1).map((msg, i) => {
                const idx = i + 1;
                if (msg.role === "user") {
                  return (
                    <div key={idx} className="flex justify-end">
                      <div
                        className="max-w-[82%] sm:max-w-[70%] px-4 py-2.5 rounded-lg text-[14px] leading-relaxed whitespace-pre-wrap"
                        style={{ backgroundColor: "var(--paper)", color: "var(--ink)", border: "1px solid var(--rule)" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] font-semibold" style={{ color: "var(--ink-muted)" }}>
                        ConsentGen
                      </span>
                    </div>
                    <div className="pl-0.5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {repairMarkdown(msg.content)}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity py-0.5"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3" style={{ color: "#3f7a4e" }} />
                            <span style={{ color: "#3f7a4e" }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs py-2" style={{ color: "var(--ink-muted)" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting response…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Unified Composer */}
        <div className="px-4 sm:px-6 pb-4 pt-2 shrink-0" style={{ backgroundColor: "var(--sheet)" }}>
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto relative rounded-lg border transition-colors focus-within:border-[var(--ink)]"
            style={{ backgroundColor: "var(--paper)", borderColor: "var(--rule)" }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a medico-legal or procedural question…"
              className="w-full max-h-36 min-h-[52px] resize-none bg-transparent pl-4 pr-14 py-3.5 text-sm outline-none text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-md flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-85 transition-opacity"
              style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[11px] text-center mt-2" style={{ color: "var(--ink-muted)" }}>
            Verify statutory citations against institutional guidelines.
          </p>
        </div>
      </main>
    </div>
  );
}
