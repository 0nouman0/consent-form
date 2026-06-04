"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Plus, MessageCircle, Trash2, Menu, X } from "lucide-react";
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

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("consentgen_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save to local storage whenever sessions change
  useEffect(() => {
    localStorage.setItem("consentgen_chat_history", JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [DEFAULT_MESSAGE];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const currentMessages = [...messages, userMessage];
    
    let currentSessionId = activeSessionId;
    let newSessionCreated = false;

    // Create a new session if none is active
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      newSessionCreated = true;
      const newSession: ChatSession = {
        id: currentSessionId,
        title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : ""),
        date: new Date().toISOString(),
        messages: [DEFAULT_MESSAGE, userMessage]
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      // Update existing session
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

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      // Append assistant response to the correct session
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

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen w-full bg-nq-bg font-inter overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* History Sidebar */}
      <aside className={`absolute md:static top-0 left-0 h-full w-72 bg-white border-r border-nq-border flex flex-col transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-nq-border flex items-center justify-between">
          <h2 className="font-bold text-nq-text">Chat History</h2>
          <button className="md:hidden p-2 text-nq-text-muted hover:text-nq-text" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-nq-purple/10 text-nq-purple hover:bg-nq-purple/20 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-nq-text-light mt-10">
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
                    ? 'bg-slate-100 text-nq-text font-semibold' 
                    : 'text-nq-text-muted hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-nq-text-light hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <header className="p-4 border-b border-nq-border bg-white flex items-center gap-3 shrink-0">
          <button 
            className="md:hidden p-2 -ml-2 text-nq-text-muted hover:text-nq-text rounded-lg hover:bg-slate-50"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-nq-text flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-nq-purple" />
              ConsentGen AI
            </h1>
            <p className="text-xs text-nq-text-light hidden md:block">
              Medical law and procedure assistant
            </p>
          </div>
        </header>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm md:text-base ${
                    msg.role === "user" 
                      ? "bg-nq-purple text-white rounded-br-sm shadow-sm" 
                      : "bg-white border border-nq-border text-nq-text rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm md:prose-base prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-nq-text">
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
                <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white border border-nq-border rounded-bl-sm shadow-sm flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-nq-purple/40 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-nq-purple/40 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-nq-purple/40 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-nq-border bg-white shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
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
              className="flex-1 max-h-32 min-h-[52px] resize-none rounded-xl border border-nq-border bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-nq-purple focus:ring-1 focus:ring-nq-purple transition-all"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-14 h-[52px] shrink-0 rounded-xl bg-nq-purple text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors shadow-sm shadow-nq-purple/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="text-xs text-center text-nq-text-light mt-3 font-medium">
            ConsentGen AI can make mistakes. Verify critical information.
          </div>
        </div>
      </main>
    </div>
  );
}
