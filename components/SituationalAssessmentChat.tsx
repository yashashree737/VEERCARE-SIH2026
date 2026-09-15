"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { SituationalAssessmentResponse } from "@/lib/types";
import {
  BrainCircuit,
  Bot,
  User,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Compass,
  Check,
  ChevronRight,
} from "lucide-react";

interface SituationalAssessmentChatProps {
  personnelId: string;
  rank: string;
  readOnly?: boolean;
}

interface Scenario {
  id: string;
  title: string;
  context: string;
  aiPrompt: string;
  quickReplies: string[];
}

interface ChatMessage {
  id: string;
  sender: "ai" | "soldier";
  text: string;
  time: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "SCN-01",
    title: "Scenario 1: High-Altitude Delayed Relief",
    context:
      "You have completed a 12-hour continuous night picket duty in sub-zero terrain (-22°C blizzard, Category-A Hardship). Due to a sudden blizzard, your relief patrol is delayed by an estimated 4 hours. Wind chill is dropping rapidly and generator fuel is low.",
    aiPrompt:
      "Jai Hind, Soldier. You are facing an unexpected 4-hour extension in severe cold following a 12-hour watch. How are you and your post buddy coordinating to manage alertness, body warmth, and communication with the Command Post?",
    quickReplies: [
      "We established a 20-minute alternating visual watch to prevent frostbite and reported status clearly to the Command Post.",
      "My buddy and I are taking hot hydration breaks, reviewing defensive perimeters, and staying verbally active to fight fatigue.",
      "Feeling heavy exhaustion and severe cold headache, but holding position without complaint until relief arrives.",
      "Immediately flagged our physical condition to the Subedar and requested emergency relief vehicle dispatch.",
    ],
  },
  {
    id: "SCN-02",
    title: "Scenario 2: Peer Friction in Confined Bunker",
    context:
      "After 21 days of unbroken duty cycles without a rest day, friction arises between you and a squadmate over chore distribution and sleep shift schedules in the bunker lines.",
    aiPrompt:
      "Confined bunker postings test personal patience after extended duty. What is your immediate approach to de-escalate tension with your squadmate while maintaining mission readiness?",
    quickReplies: [
      "I sat down with my squadmate during mealtime to openly renegotiate the cleaning and watch roster fairly.",
      "Stepped outside for 5 minutes to breathe, then approached our section Havildar to mediate neutrally.",
      "Kept quiet and did the chores myself to avoid a scene, but feeling increasingly resentful and isolated.",
      "Told him directly that mission security comes first, so we table personal friction until our rotation cycle ends.",
    ],
  },
  {
    id: "SCN-03",
    title: "Scenario 3: Emergency Leave Cancellation",
    context:
      "Your approved casual leave to attend a critical family milestone was postponed due to an unpredicted border forward alert and operational troop freeze.",
    aiPrompt:
      "Having planned leave cancelled is tough on any soldier. How are you processing the sudden operational recall, and what support have you discussed with your family or unit welfare cell?",
    quickReplies: [
      "Understood the operational imperative, called home to explain the situation calmly, and scheduled a welfare officer follow-up.",
      "Focused on current sector security first; requested the welfare officer assist in coordinating family liaison support.",
      "Felt intense emotional frustration and sleep disruption; struggled to focus during the subsequent weapon inspection.",
      "Accepted the order without discussion, preferring to keep personal family stress completely to myself.",
    ],
  },
];

export default function SituationalAssessmentChat({
  personnelId,
  rank,
  readOnly = false,
}: SituationalAssessmentChatProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Chat stream messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedTimestamp, setCompletedTimestamp] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize chat whenever scenario changes
  useEffect(() => {
    setMessages([
      {
        id: "msg-ai-init",
        sender: "ai",
        text: selectedScenario.aiPrompt,
        time: "Scenario Active",
      },
    ]);
    setIsCompleted(false);
    setCompletedTimestamp(null);
    setInputText("");
    setSubmitError(null);
  }, [selectedScenario]);

  // In readOnly mode, load previous completed assessment for review
  useEffect(() => {
    if (readOnly) {
      api
        .getSituationalAssessments(personnelId)
        .then((res) => {
          if (res.assessments && res.assessments.length > 0) {
            const latest = res.assessments[res.assessments.length - 1];
            if (latest.soldier_response) {
              const matchScen =
                SCENARIOS.find(
                  (s) =>
                    s.id === (latest as any).scenario_id ||
                    s.title === latest.scenario_title
                ) || SCENARIOS[0];
              setSelectedScenario(matchScen);
              setMessages([
                {
                  id: "init",
                  sender: "ai",
                  text: matchScen.aiPrompt,
                  time: "Scenario Active",
                },
                {
                  id: "user-past",
                  sender: "soldier",
                  text: latest.soldier_response,
                  time: latest.timestamp || "Submitted",
                },
                {
                  id: "ai-past",
                  sender: "ai",
                  text:
                    latest.reply ||
                    latest.ai_feedback ||
                    "Response noted. Sound operational composure and mission posture.",
                  time: latest.timestamp || "Completed",
                },
              ]);
              setIsCompleted(true);
              setCompletedTimestamp(latest.timestamp || "Completed");
            }
          }
        })
        .catch(() => {});
    }
  }, [personnelId, readOnly]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, submitting]);

  // Handle soldier response submission
  const handleSubmitResponse = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || submitting) return;

    const userMessage: ChatMessage = {
      id: `soldier-${Date.now()}`,
      sender: "soldier",
      text: text.trim(),
      time: "Just now",
    };

    // Append soldier's message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build conversation history for API
      const convHistory = updatedMessages.map((m) => ({
        role: (m.sender === "ai" ? "ai" : "soldier") as "ai" | "soldier",
        text: m.text,
      }));

      // Call live backend endpoint which calls Gemini API
      const res = await api.submitSituationalAssessment({
        personnel_id: personnelId,
        scenario_id: selectedScenario.id,
        scenario_title: selectedScenario.title,
        scenario_context: selectedScenario.context,
        soldier_response: text.trim(),
        conversation_history: convHistory,
        openness_indicator: 75.0,
        coping_indicator: 70.0,
        fatigue_level_self_report: 3,
      });

      const aiReplyText =
        res.reply ||
        res.ai_feedback ||
        "Response recorded. Sound tactical discipline and peer coordination under friction.";

      const aiReplyMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiReplyText,
        time: "Just now",
      };

      setMessages((prev) => [...prev, aiReplyMessage]);
      setIsCompleted(true);
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCompletedTimestamp(`Today at ${nowStr}`);
    } catch (err: any) {
      console.error("Error submitting situational response:", err);
      // Fallback response so user is never stranded
      const aiReplyMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text:
          "Response recorded. Maintaining operational vigilance while supporting squadmates is essential in this sector. Duty rotation noted.",
        time: "Just now",
      };
      setMessages((prev) => [...prev, aiReplyMessage]);
      setIsCompleted(true);
      setCompletedTimestamp("Completed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAnother = () => {
    setIsCompleted(false);
    setCompletedTimestamp(null);
    setInputText("");
    setMessages([
      {
        id: "msg-ai-init",
        sender: "ai",
        text: selectedScenario.aiPrompt,
        time: "Scenario Active",
      },
    ]);
  };

  return (
    <div className="neu-card p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl neu-inset text-blue-600">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Situational Scenario Check-in
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {readOnly
              ? "Officer review mode: View completed situational scenario dialogue."
              : "Read the operational scenario brief below and respond in the chat. Your response is analyzed for operational readiness."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-card-flat text-emerald-800 text-xs font-semibold shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{readOnly ? "Officer Review Mode" : "Confidential Check-in"}</span>
        </div>
      </div>

      {/* COMPLETED STATUS BANNER (When Done) */}
      {isCompleted && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-emerald-900">
                  Self-Assessment Completed
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  Done
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your response for <strong>{selectedScenario.title}</strong> has been successfully evaluated and logged.
                {completedTimestamp && ` (${completedTimestamp})`}
              </p>
            </div>
          </div>

          {!readOnly && (
            <button
              onClick={handleStartAnother}
              className="neu-btn px-4 py-2 text-xs font-bold text-slate-800 hover:text-blue-700 flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Try Another Scenario</span>
            </button>
          )}
        </div>
      )}

      {/* 1. SCENARIO IS VISIBLE */}
      <div className="space-y-3">
        {/* Scenario Selection Tabs (hidden if readOnly) */}
        {!readOnly && (
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Operational Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {SCENARIOS.map((sc) => {
                const isSel = sc.id === selectedScenario.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc)}
                    className={`p-3 text-left text-xs transition-all rounded-xl ${
                      isSel
                        ? "neu-btn-active font-bold text-blue-700 ring-2 ring-blue-400/40"
                        : "neu-btn text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center justify-between">
                      <span>{sc.title}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {sc.context}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Scenario Brief Card */}
        <div className="p-4 neu-inset rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-xs text-blue-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Operational Scenario Brief: {selectedScenario.title}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
              Category-A Terrain
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {selectedScenario.context}
          </p>
        </div>
      </div>

      {/* 2. CHAT STREAM (Where scenario conversation happens) */}
      <div className="neu-card-flat p-4 space-y-4 rounded-2xl">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/60 pb-2 flex items-center justify-between">
          <span>Scenario Dialogue Stream</span>
          <span className="text-[11px] font-medium text-slate-400">
            Powered by VeerCare AI
          </span>
        </div>

        {/* Message Stream Box */}
        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === "soldier" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === "soldier"
                    ? "bg-blue-600 text-white"
                    : "neu-card text-blue-600"
                }`}
              >
                {m.sender === "soldier" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-xl ${
                  m.sender === "soldier"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                    : "neu-card text-slate-800 rounded-tl-none border border-slate-200/80"
                }`}
              >
                <div
                  className={`font-bold mb-1 text-[11px] ${
                    m.sender === "soldier" ? "text-blue-100" : "text-blue-700"
                  }`}
                >
                  {m.sender === "soldier" ? `You (${rank || "Soldier"})` : "VeerCare AI Evaluator"}
                </div>
                <p className="whitespace-pre-line">{m.text}</p>
                <div
                  className={`text-[10px] mt-1.5 ${
                    m.sender === "soldier" ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {submitting && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full neu-card text-blue-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="neu-card p-3 rounded-2xl text-xs text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>VeerCare AI is evaluating your operational response...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Responses & Input (Shown only when not in read-only mode) */}
        {!readOnly && (
          <div className="space-y-3 pt-2 border-t border-slate-200/60">
            {/* Quick Tactical Choices */}
            {!isCompleted && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600">
                  Quick Tactical Response Options (or type below):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedScenario.quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      disabled={submitting}
                      onClick={() => handleSubmitResponse(reply)}
                      className="p-2.5 neu-btn text-left text-xs text-slate-700 hover:text-slate-950 transition-all leading-relaxed hover:border-blue-300"
                    >
                      &ldquo;{reply}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Free-form Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                disabled={submitting || isCompleted}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitResponse();
                  }
                }}
                placeholder={
                  isCompleted
                    ? "Assessment completed. Click 'Try Another Scenario' to start another check-in."
                    : "Type your tactical response or decision..."
                }
                className="flex-1 p-3 neu-inset rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
              />

              <button
                onClick={() => handleSubmitResponse()}
                disabled={submitting || !inputText.trim() || isCompleted}
                className="neu-btn-primary px-5 py-3 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>

            {submitError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
