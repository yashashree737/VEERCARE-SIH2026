"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  Smile,
  Sun,
  Coffee,
  CloudRain,
  MessageSquare,
  Calendar,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wind,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Clock,
  Compass,
  Headphones,
  LifeBuoy,
} from "lucide-react";

interface SoldierHomeViewProps {
  profile: {
    personnel_id: string;
    rank: string;
    home_unit_id: string;
  };
  userName?: string;
  onNavigateTab: (tab: string) => void;
  dutyCount?: number;
  restCount?: number;
  deploymentZone?: string;
}

type MoodKey = "great" | "calm" | "okay" | "tired" | "stressed";

interface MoodOption {
  key: MoodKey;
  label: string;
  emoji: string;
  color: string;
  response: string;
}

const MOODS: MoodOption[] = [
  {
    key: "great",
    label: "Energetic and Strong",
    emoji: "🌟",
    color: "text-amber-700 border-amber-300 bg-amber-50/50",
    response:
      "Wonderful to hear! Keep that positive energy alive and look out for your squad buddies today.",
  },
  {
    key: "calm",
    label: "Calm and Peaceful",
    emoji: "😌",
    color: "text-emerald-700 border-emerald-300 bg-emerald-50/50",
    response:
      "Peace of mind is true resilience. Enjoy the steady rhythm of your day.",
  },
  {
    key: "okay",
    label: "Just Okay",
    emoji: "😐",
    color: "text-blue-700 border-blue-300 bg-blue-50/50",
    response:
      "Steady as she goes. Remember to take things one step at a time.",
  },
  {
    key: "tired",
    label: "Tired / Need Rest",
    emoji: "🥱",
    color: "text-indigo-700 border-indigo-300 bg-indigo-50/50",
    response:
      "Rest is essential for every warrior. Try to hydrate, stretch, and get quality sleep when your shift ends.",
  },
  {
    key: "stressed",
    label: "Heavy or Stressed",
    emoji: "🌧️",
    color: "text-rose-700 border-rose-300 bg-rose-50/50",
    response:
      "It takes real courage to acknowledge feeling heavy. Take a deep breath—you are not alone. Our AI companion and 24/7 counselors are here for you.",
  },
];

export default function SoldierHomeView({
  profile,
  userName,
  onNavigateTab,
  dutyCount = 0,
  restCount = 0,
  deploymentZone = "Station Zone",
}: SoldierHomeViewProps) {
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Pause">("Inhale");
  const [breathCount, setBreathCount] = useState(4);

  // Simple Box Breathing Timer (4-4-4-4)
  useEffect(() => {
    if (!isBreathingActive) return;

    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases
        setBreathPhase((currentPhase) => {
          if (currentPhase === "Inhale") return "Hold";
          if (currentPhase === "Hold") return "Exhale";
          if (currentPhase === "Exhale") return "Pause";
          return "Inhale";
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const activeMoodObj = MOODS.find((m) => m.key === selectedMood);

  return (
    <div className="space-y-6">
      {/* 1. Welcoming Hero Banner */}
      <div className="neu-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold neu-card-flat text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Confidential and Safe Personal Space</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Jai Hind!
              </h1>
              <p className="text-base sm:text-lg font-bold text-slate-700">
                welcome {profile.personnel_id}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Welcome to your personal wellness companion. You serve our nation with dedication; here, we ensure your well-being, peace of mind, and recovery are supported. Everything here is strictly private and just for you.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                Zone: <strong className="text-slate-700">{deploymentZone}</strong>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Unit: <strong className="text-slate-700">{profile.home_unit_id}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl neu-inset text-center min-w-[140px]">
            <div className="w-12 h-12 rounded-full neu-card-flat flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
              <Heart className="w-6 h-6 fill-emerald-100 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-800">Status: Active</span>
            <span className="text-[11px] text-emerald-700 font-medium">Ready and Protected</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Daily Vibe Check-In */}
      <div className="neu-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              How are you feeling today, brother?
            </h3>
          </div>
          <span className="text-xs text-slate-500 italic hidden sm:inline">
            Tap to check in with yourself
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMood(m.key)}
                className={`p-3 rounded-xl transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? `${m.color} neu-inset font-bold scale-102 ring-2 ring-blue-400/50`
                    : "neu-card-flat hover:scale-102 text-slate-700"
                }`}
              >
                <span className="text-2xl select-none">{m.emoji}</span>
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {activeMoodObj && (
          <div className="p-3.5 rounded-xl neu-inset text-xs flex items-start gap-2.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900">
                {activeMoodObj.emoji} {activeMoodObj.label}
              </p>
              <p className="text-slate-700 leading-relaxed">
                {activeMoodObj.response}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Three Welcoming Doorways (Main Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Door 1: AI Scenario Companion */}
        <div className="neu-card p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-blue-600 mb-1">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Talk with AI Companion
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore friendly operational and daily life scenarios at your own pace. Confidential, interactive, and completely score-free.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("self-assessment")}
            className="neu-btn-primary w-full py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Start Scenario Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Door 2: Duty Calendar & Rest */}
        <div className="neu-card p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-indigo-600 mb-1">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Duty and Rest Activity
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check your 365-day shift register, upcoming rest cycles, leave balances, and recovery schedule at a glance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("duty")}
            className="neu-btn w-full py-2.5 px-3 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer hover:text-blue-700"
          >
            <span>View Duty Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Door 3: 24/7 Welfare Support */}
        <div className="neu-card p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-emerald-600 mb-1">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              24/7 Jawan Support
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect with friendly welfare counselors, peer listeners, or emergency wellness resources. Always confidential and free.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("support")}
            className="neu-btn w-full py-2.5 px-3 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-50"
          >
            <span>Get Friendly Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Interactive Quick Breathing Tool & Daily Inspiration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box Breathing Tool */}
        <div className="neu-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                1-Minute Calming Breath
              </h3>
            </div>
            <span className="text-xs text-slate-500">Box Breathing 4-4-4</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Take a short pause before or after your duty shift to calm your heartbeat and refresh your focus.
          </p>

          <div className="py-4 flex flex-col items-center justify-center gap-3">
            {isBreathingActive ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-inner ${
                    breathPhase === "Inhale"
                      ? "scale-110 bg-teal-100/80 ring-4 ring-teal-400/40 text-teal-900"
                      : breathPhase === "Hold"
                      ? "scale-110 bg-indigo-100/80 ring-4 ring-indigo-400/40 text-indigo-900"
                      : breathPhase === "Exhale"
                      ? "scale-90 bg-blue-100/80 ring-4 ring-blue-400/40 text-blue-900"
                      : "scale-90 bg-slate-100 ring-2 ring-slate-300 text-slate-700"
                  }`}
                >
                  <span className="text-sm font-extrabold">{breathPhase}</span>
                  <span className="text-xl font-mono font-bold">{breathCount}s</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBreathingActive(false)}
                  className="text-xs neu-btn px-3 py-1 text-slate-600 hover:text-slate-900 rounded-lg mt-1"
                >
                  Stop Exercise
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBreathPhase("Inhale");
                  setBreathCount(4);
                  setIsBreathingActive(true);
                }}
                className="neu-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Start 1-Minute Breath</span>
              </button>
            )}
          </div>
        </div>

        {/* Daily Morale and Wisdom Card */}
        <div className="neu-card p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
              <Sun className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Soldier Wisdom and Morale
              </h3>
            </div>
            <blockquote className="text-xs sm:text-sm text-slate-700 italic leading-relaxed neu-inset p-3.5 rounded-xl border-l-4 border-amber-500">
              "True courage is not merely pushing through fatigue, but having the wisdom to rest and recharge. Looking after your mind is an essential part of your duty."
            </blockquote>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Encouragement for Today
            </span>
            <span className="text-slate-500 font-medium">VeerCare Indian Armed Forces</span>
          </div>
        </div>
      </div>
    </div>
  );
}
