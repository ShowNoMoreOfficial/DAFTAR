"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { useGIContext } from "./gi-context";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "gi";
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

export function GIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "gi",
      content: "Hi! I'm GI, your organizational copilot. Ask me about your tasks, deadlines, or team status.",
      suggestions: ["How are my tasks?", "Any overdue?", "What can you do?"],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { context } = useGIContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        setMessages((prev) => [
          ...prev,
          {
            role: "gi",
            content: data.message,
            suggestions: data.suggestions,
            timestamp: new Date(),
          },
        ]);
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2E86AB] to-[#A23B72] text-white shadow-lg transition-transform hover:scale-110"
        title="Open GI Assistant"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl transition-all",
        minimized ? "h-12 w-72" : "h-[500px] w-[380px]"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#2E86AB] to-[#A23B72] px-4 py-3 cursor-pointer"
        onClick={() => minimized && setMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">GI Assistant</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] text-white/80">v1</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
            className="rounded p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="rounded p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-[#2E86AB] text-white rounded-br-sm"
                      : "bg-[#F0F2F5] text-[#1A1A1A] rounded-bl-sm"
                  )}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="rounded-full border border-[#2E86AB]/30 bg-white px-2.5 py-1 text-[10px] font-medium text-[#2E86AB] transition-colors hover:bg-[#2E86AB]/10"
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
                <div className="rounded-2xl rounded-bl-sm bg-[#F0F2F5] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9CA3AF]" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9CA3AF]" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9CA3AF]" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Context indicator */}
          <div className="border-t border-[#F0F2F5] px-3 py-1.5">
            <span className="text-[10px] text-[#9CA3AF]">
              Context: {context.currentModule} / {context.currentView}
            </span>
          </div>

          {/* Input */}
          <div className="border-t border-[#E5E7EB] p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask GI anything..."
                rows={1}
                className="min-h-[36px] resize-none text-sm"
              />
              <Button
                size="sm"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="h-9 w-9 shrink-0 p-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
