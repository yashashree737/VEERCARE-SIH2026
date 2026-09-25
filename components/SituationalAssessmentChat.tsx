"use client";

/**
 * AI Scenario Chat.
 * A simple confidential chat where the soldier talks to the VeerCare AI. The AI
 * (n8n "Soldier Scenario to OCEAN Personality" workflow) drives the conversation
 * with random operational scenarios. The workflow also returns OCEAN "data
 * pointers" alongside its reply — we accept them and do nothing with them for
 * now (frontend-first). Styled to match the neumorphic light theme.
 */

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Bot, User, Send, ShieldCheck, RefreshCw, BrainCircuit, RotateCcw, Lock } from "lucide-react";

interface SituationalAssessmentChatProps {
  personnelId: string;
  rank: string;
  readOnly?: boolean;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "soldier";
  text: string;
}

// n8n "Soldier Scenario to OCEAN Personality" webhook. Returns { reply, <5 OCEAN traits> }.
const SCENARIO_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_OCEAN_WEBHOOK ||
  "https://atharvjagtap.app.n8n.cloud/webhook/a110a8c4-c024-41d0-9fa4-be8eb69b603a/chat";

// First message we send to get the AI to open with a random scenario.
const KICKOFF =
  "Start a confidential check-in. Present one realistic operational scenario as a short question for the soldier.";

const FALLBACK =
  "Jai Hind. I'm here whenever you want to talk something through — take your time and share what's on your mind.";

export default function SituationalAssessmentChat({
  personnelId,
  rank,
  readOnly = false,
}: SituationalAssessmentChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sessionIdRef = useRef<string>(`veer-scn-${personnelId}`);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const post = async (chatInput: string): Promise<string> => {
    const res = await fetch(SCENARIO_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: sessionIdRef.current,
        chatInput,
      }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data: any = await res.json();
    // OCEAN data pointers (data.Neuroticism etc.) arrive here — accepted, unused for now.
    return data?.reply || data?.output || data?.text || FALLBACK;
  };

  // On open (non-readOnly): ask the AI to present the first random scenario.
  useEffect(() => {
    if (readOnly || startedRef.current) return;
    startedRef.current = true;
    setSending(true);
    post(KICKOFF)
      .then((reply) => setMessages([{ id: "ai-open", sender: "ai", text: reply }]))
      .catch(() => setMessages([{ id: "ai-open", sender: "ai", text: FALLBACK }]))
      .finally(() => setSending(false));
  }, [readOnly]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: `s-${Date.now()}`, sender: "soldier", text }]);
    setInput("");
    setSending(true);
    try {
      const reply = await post(text);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: "ai", text: FALLBACK }]);
    } finally {
      setSending(false);
    }
  };

  const newScenario = () => {
    if (sending) return;
    setMessages([]);
    setSending(true);
    post(KICKOFF)
      .then((reply) => setMessages([{ id: `ai-${Date.now()}`, sender: "ai", text: reply }]))
      .catch(() => setMessages([{ id: `ai-${Date.now()}`, sender: "ai", text: FALLBACK }]))
      .finally(() => setSending(false));
  };

  if (user && user.role !== "personnel") {
    return (
      <div className="neu-card p-6 sm:p-8 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-rose-600 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Confidential Personnel Feature</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          The Veer AI Companion and Scenario Chat is strictly confidential and reserved exclusively for logged-in Force Personnel. Commanders, Welfare Officers, and HR Administrators cannot view or access this companion.
        </p>
      </div>
    );
  }

  return (
    <div className="neu-card p-6 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl neu-inset text-blue-600">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-section-title text-slate-900">AI Scenario Chat</h3>
            <p className="text-body-secondary text-slate-600 mt-0.5">
              {readOnly
                ? "Officer review mode."
                : "A confidential space to talk things through with the VeerCare AI."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!readOnly && (
            <button
              onClick={newScenario}
              disabled={sending}
              className="neu-btn px-3.5 py-1.5 text-metadata font-bold text-slate-700 hover:text-blue-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>New scenario</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full neu-card-flat text-emerald-800 text-metadata font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confidential</span>
          </div>
        </div>
      </div>

      {/* Chat stream */}
      <div className="neu-card-flat p-4 sm:p-5 rounded-2xl">
        <div className="max-h-[440px] min-h-[200px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {messages.length === 0 && !sending && (
            <p className="text-body-secondary text-slate-500 text-center pt-10">
              {readOnly ? "No conversation to display." : "Starting your check-in…"}
            </p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === "soldier" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${m.sender === "soldier" ? "bg-blue-600 text-white" : "neu-card text-blue-600"
                  }`}
              >
                {m.sender === "soldier" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-4 rounded-2xl text-body-base leading-relaxed max-w-xl ${m.sender === "soldier"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-xs"
                    : "neu-card text-slate-900 rounded-tl-none border border-slate-200/80"
                  }`}
              >
                <div
                  className={`font-bold mb-1 text-metadata ${m.sender === "soldier" ? "text-blue-100" : "text-blue-700"
                    }`}
                >
                  {m.sender === "soldier" ? `You (${rank || "Soldier"})` : "VeerCare AI"}
                </div>
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full neu-card text-blue-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="neu-card p-3 rounded-2xl text-body-secondary text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>VeerCare AI is typing…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!readOnly && (
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 pt-4 mt-4 border-t border-slate-200/60">
            <input
              type="text"
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type your reply…"
              className="w-full lg:flex-1 p-3 neu-inset rounded-xl text-body-base text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="w-full lg:w-auto neu-btn-primary px-5 py-3 text-body-base font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 lg:shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}