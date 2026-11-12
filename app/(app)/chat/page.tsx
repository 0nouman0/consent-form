"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  Plus,
  Trash2,
  Menu,
  X,
  Gavel,
  Stethoscope,
  FileText,
  ShieldCheck,
  Copy,
  Check,
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
  content: "Hi Doctor, I'm ConsentGen AI. How can I help you with medico-legal or procedural questions today?",
};

const SUGGESTED_PROMPTS = [
  {
    icon: Gavel,
    title: "Consent law basics",
    prompt: "What are the essential elements of valid informed consent under Indian law?",
  },
  {
    icon: Stethoscope,
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

/**
 * Aggressively cleans up AI-generated markdown so remark-gfm can parse tables
 * and lists correctly even when the model puts everything on one line.
 */
function repairMarkdown(raw: string): string {
  if (!raw) return "";
  let s = raw;

  // 1. Normalize Windows line endings
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Strip literal <br> and <br/> tags — replace with newline
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // 3. If the entire response looks like a flattened single-line table
  //    (pipe-separated, no real newlines between rows), split it out.
  //    Pattern: "| cell | cell | ... | | cell |" => split on " | |" or " || "
  s = s.replace(/\|\s*\|\s*\|/g, "|\n|");   // "| ... | | ..." -> newline before next row
  s = s.replace(/\|\s{2,}\|/g, "|\n|");     // "| ...  |" with extra spaces

  // 4. Ensure separator row (|---|---|) is on its own line
  s = s.replace(/(\|[^|]+\|)(\s*\|[-: ]+\|)/g, "$1\n$2");
  s = s.replace(/(\|[-: ]+\|)(\s*\|[^|]+\|)/g, "$1\n$2");

  // 5. Ensure a blank line before any table so remark-gfm treats it as a block
  s = s.replace(/([^\n])(\n\|)/g, "$1\n\n|");

  // 6. Ensure blank line before headings (#, ##, ###)
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
        title: userMessage.content.slice(0, 42) + (userMessage.content.length > 42 ? "…" : ""),
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
                  { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." },
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

  /* ─── Markdown component overrides ─── */
  const mdComponents = {
    h1: ({ children }: any) => (
      <h1 className="font-serif text-[15px] font-bold text-[var(--ink)] mt-5 mb-2 pb-1.5 border-b border-[var(--rule)]">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="font-serif text-[14px] font-bold text-[var(--ink)] mt-4 mb-1.5 pb-1 border-b border-[var(--rule)]">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-[13.5px] font-bold text-[var(--ink)] mt-3.5 mb-1">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-[13px] font-semibold text-[var(--ink)] mt-2.5 mb-1">
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-[13.5px] leading-relaxed my-2 text-[var(--ink-soft)]">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-5 my-2.5 space-y-1.5 marker:text-[var(--red)]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-5 my-2.5 space-y-1.5 marker:font-semibold marker:text-[var(--ink)]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[13.5px] leading-relaxed text-[var(--ink-soft)] pl-0.5">
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
      <blockquote className="my-3 pl-3.5 pr-3 py-2.5 rounded-r-md border-l-[3px] border-[var(--red)] bg-[var(--paper)] text-[13px] text-[var(--ink-soft)] leading-relaxed">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="px-1.5 py-0.5 rounded bg-[var(--paper)] border border-[var(--rule)] font-mono text-[11.5px] text-[var(--ink)]">
        {children}
      </code>
    ),
    hr: () => <hr className="my-4 border-[var(--rule)]" />,
    // ── Tables ──
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto rounded-md border border-[var(--rule)]">
        <table className="w-full border-collapse text-left text-[12.5px] min-w-[480px]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead style={{ backgroundColor: "var(--paper)", borderBottom: "1.5px solid var(--rule)" }}>
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-[var(--rule)]">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="even:bg-[rgba(23,20,16,0.02)] hover:bg-[rgba(23,20,16,0.03)] transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--ink)] whitespace-nowrap font-mono">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2.5 align-top text-[var(--ink-soft)] leading-relaxed text-[12.5px]">
        {children}
      </td>
    ),
  };

  return (
    <div
      className="flex-1 flex w-full font-body overflow-hidden relative"
      style={{ backgroundColor: "var(--paper)" }}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(23,20,16,0.25)" }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`absolute md:static top-0 left-0 h-full w-72 flex flex-col transition-transform duration-300 z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: "var(--sheet)", borderRight: "1px solid var(--rule)" }}
      >
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--rule)" }}>
          <h2 className="font-serif text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
            Chat History
          </h2>
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
            sessions.map((session) => (
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
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium truncate block">{session.title}</span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--ink-muted)" }}>
                      {relativeDate(session.date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 transition-all text-[var(--ink-muted)] hover:text-[var(--red)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Header */}
        <header
          className="px-5 py-4 flex items-center gap-3 shrink-0"
          style={{ backgroundColor: "var(--sheet)", borderBottom: "1px solid var(--rule)" }}
        >
          <button
            className="md:hidden p-2 -ml-1 rounded-md transition-all text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--ink)" }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "var(--sheet)" }} />
            </div>
            <div>
              <h1 className="font-serif text-sm font-semibold" style={{ color: "var(--ink)" }}>
                ConsentGen{" "}
                <span className="font-serif font-semibold" style={{ color: "var(--red)" }}>
                  assistant
                </span>
              </h1>
              <p className="text-xs hidden md:block" style={{ color: "var(--ink-muted)" }}>
                Medical law and procedure assistant
              </p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
          style={{ backgroundColor: "var(--paper)" }}
        >
          {isNewChat ? (
            /* Welcome state */
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: "var(--ink)" }}
              >
                <MessageCircle className="w-7 h-7" style={{ color: "var(--sheet)" }} strokeWidth={1.5} />
              </div>
              <h2
                className="font-serif text-2xl font-semibold tracking-tight mb-2 text-center"
                style={{ color: "var(--ink)" }}
              >
                How can I help,{" "}
                <span style={{ color: "var(--red)" }}>Doctor?</span>
              </h2>
              <p className="text-sm text-center mb-8 max-w-sm" style={{ color: "var(--ink-muted)" }}>
                Ask about consent law, medico-legal documentation, NMC regulations, or clinical procedures in India.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map(({ icon: Icon, title, prompt }) => (
                  <button
                    key={title}
                    onClick={() => sendMessage(prompt)}
                    className="text-left p-4 rounded-lg hover:-translate-y-0.5 hover:shadow-sm transition-all group"
                    style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2.5 transition-colors bg-[var(--paper)] group-hover:bg-[var(--ink)]">
                      <Icon
                        className="w-4 h-4 transition-colors text-[var(--ink-muted)] group-hover:text-[var(--sheet)]"
                        strokeWidth={1.75}
                      />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>
                      {title}
                    </p>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--ink-muted)" }}>
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI avatar */}
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--ink)" }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" style={{ color: "var(--sheet)" }} strokeWidth={2} />
                    </div>
                  )}

                  <div
                    className={`group relative ${
                      msg.role === "user"
                        ? "max-w-[78%] md:max-w-[65%]"
                        : "max-w-[91%] md:max-w-[85%] min-w-0 flex-1"
                    }`}
                  >
                    <div
                      className={`rounded-xl text-sm ${
                        msg.role === "user"
                          ? "px-4 py-3 rounded-tr-sm"
                          : "px-5 py-4 rounded-tl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? { backgroundColor: "var(--ink)", color: "var(--sheet)" }
                          : {
                              backgroundColor: "var(--sheet)",
                              color: "var(--ink-soft)",
                              border: "1px solid var(--rule)",
                              boxShadow: "0 1px 4px rgba(23,20,16,0.05)",
                            }
                      }
                    >
                      {msg.role === "assistant" ? (
                        <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={mdComponents}
                          >
                            {repairMarkdown(msg.content)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>

                    {/* Copy button */}
                    {msg.role === "assistant" && idx > 0 && (
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        title="Copy response"
                        className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3" style={{ color: "#3f7a4e" }} strokeWidth={2.5} />
                            <span style={{ color: "#3f7a4e" }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" strokeWidth={2} />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "var(--ink)" }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" style={{ color: "var(--sheet)" }} strokeWidth={2} />
                  </div>
                  <div
                    className="rounded-xl px-5 py-4 flex items-center gap-1.5"
                    style={{ backgroundColor: "var(--sheet)", border: "1px solid var(--rule)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "var(--ink-muted)", animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "var(--ink-muted)", animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: "var(--ink-muted)", animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="p-4 shrink-0"
          style={{ backgroundColor: "var(--sheet)", borderTop: "1px solid var(--rule)" }}
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
              placeholder="Ask a medical or legal question…"
              className="flex-1 max-h-32 min-h-[48px] resize-none rounded-lg px-4 py-3 text-sm outline-none transition-all border border-[var(--rule)] focus:border-[var(--ink)] text-[var(--ink)] placeholder:text-[var(--ink-muted)] bg-[var(--paper)] focus:bg-[var(--sheet)]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-85 transition-opacity"
              style={{ backgroundColor: "var(--ink)", color: "var(--sheet)" }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" strokeWidth={2} />
              )}
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
