"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Strip any stray Markdown/formatting symbols so coach replies render clean.
function cleanReply(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/(^|\n)\s*#+\s*/g, "$1")
    .replace(/\*/g, "")
    .replace(/`/g, "");
}

export function CoachChat({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = () => {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    startTransition(async () => {
      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Something went wrong. Please try again.");
          return;
        }
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } catch {
        setError("Could not reach the coach. Check your connection and try again.");
      }
    });
  };

  return (
    <div className="panel-glass flex h-[calc(100vh-14rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 text-black">
          <Bot className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">AI Coach</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", pending ? "bg-amber-400" : "bg-emerald-400")} />
            {pending ? "thinking…" : "grounded in your live data"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          <Sparkles className="h-3 w-3" /> Inception
        </span>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <Bot className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">Ask about training or diet.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-gradient-to-br from-emerald-400/90 to-lime-400/90 text-black"
                  : "rounded-bl-md border border-border/60 bg-muted/40"
              )}
            >
              {m.role === "assistant" ? cleanReply(m.content) : m.content}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/60 bg-muted/40 px-4 py-3">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 motion-safe:animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${d * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
      </div>

      {/* Input */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message your coach…"
            className="h-11 flex-1 rounded-xl"
          />
          <Button onClick={send} disabled={pending || !input.trim()} size="icon" className="h-11 w-11 rounded-xl">
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
