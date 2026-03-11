"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, X, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { useGIContext } from "./gi-context";
import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "gi";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

// Contextual suggestion chips per module
const MODULE_SUGGESTIONS: Record<string, string[]> = {
  daftar: ["What should I focus on today?", "Summarize this week", "Who's overloaded?"],
  pms: ["Show overdue tasks", "Who has bandwidth?", "Reassign overdue tasks"],
  yantri: ["What topics are trending?", "Pipeline status", "Start pipeline for a signal"],
  khabri: ["Top signals today", "Any breaking news?", "Show signal trends"],
  hoccr: ["How's team health?", "Who needs recognition?", "Show bottlenecks"],
  relay: ["What's scheduled this week?", "Publishing analytics", "Next publish date"],
  finance: ["Outstanding invoices", "Monthly overview", "Pending expenses"],
};

export function GIAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // fully hidden
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "gi",
      content: "Hi! I'm GI, your organizational copilot. Ask me about tasks, content, team health, or anything else.",
      suggestions: ["What needs my attention?", "How are my tasks?", "What can you do?"],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { context } = useGIContext();
  const { isCollapsed: sidebarCollapsed } = useSidebarStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcut: Ctrl+/ to focus GI input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setCollapsed(false);
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), context }),
      });

      if (res.ok) {
        const data = await res.json();
        const newMessages: ChatMessage[] = [
          {
            role: "gi",
            content: data.message,
            suggestions: data.suggestions,
            timestamp: new Date(),
          },
        ];
        if (data.proactiveInsight) {
          newMessages.push({
            role: "gi",
            content: data.proactiveInsight,
            timestamp: new Date(),
          });
        }
        setMessages((prev) => [...prev, ...newMessages]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "gi", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "gi", content: "Connection error. Please check your connection.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const contextSuggestions = MODULE_SUGGESTIONS[context.currentModule] || MODULE_SUGGESTIONS.daftar;

  // Fully collapsed — show just a subtle bar
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-0 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-t-xl border border-b-0 border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs text-[var(--text-muted)] shadow-[var(--shadow-md)] transition-all hover:text-[var(--accent-primary)]"
      >
        <Sparkles className="h-3.5 w-3.5" />
        GI Assistant
        <ChevronUp className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-40 flex flex-col border-t border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] transition-all duration-300 left-0",
        sidebarCollapsed ? "md:left-16" : "md:left-[260px]",
        expanded ? "h-[40vh] min-h-[300px]" : "h-auto"
      )}
    >
      {/* Resize handle (when expanded) */}
      {expanded && (
        <div className="flex h-1.5 cursor-row-resize items-center justify-center">
          <div className="h-1 w-8 rounded-full bg-[var(--border-default)]" />
        </div>
      )}

      {/* Header bar — always visible */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)]">GI Assistant</span>
          <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">
            {context.currentModule}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--status-error)]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded: show messages */}
      {expanded && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] rounded-br-sm"
                    : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-sm border-l-2 border-l-[var(--accent-primary)]"
                )}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="rounded-full border border-[var(--accent-primary)]/30 bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--accent-primary)] transition-colors hover:bg-[rgba(0,212,170,0.1)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-[var(--bg-elevated)] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--accent-primary)]" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Suggestion chips (when not expanded) */}
      {!expanded && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
          {contextSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setExpanded(true);
                sendMessage(s);
              }}
              className="shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--bg-deep)] px-3 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[var(--border-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => !expanded && setExpanded(true)}
            placeholder="Ask GI anything... (Ctrl+/)"
            rows={1}
            className="min-h-[36px] resize-none border-[var(--border-default)] bg-[var(--bg-deep)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <Button
            size="sm"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="h-9 w-9 shrink-0 rounded-full bg-[var(--accent-primary)] p-0 text-[var(--text-inverse)] hover:bg-[var(--accent-primary)]/90"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
