"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Volume2,
  Mic,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

interface PeriodicTestViewProps {
  personnelId: string;
  userName?: string;
}

// WHO-5 Question items
const WHO5_QUESTIONS = [
  {
    id: 1,
    question: "I have felt cheerful and in good spirits",
    description: "Overall positive mood and emotional brightness over the past 2 weeks.",
  },
  {
    id: 2,
    question: "I have felt calm and relaxed",
    description: "Sense of inner peace, low anxiety, and mental composure.",
  },
  {
    id: 3,
    question: "I have felt active and vigorous",
    description: "Physical energy, stamina, and readiness for daily duties.",
  },
  {
    id: 4,
    question: "I woke up feeling fresh and rested",
    description: "Sleep quality, restfulness, and waking recovery level.",
  },
  {
    id: 5,
    question: "My daily life has been filled with things that interest me",
    description: "Engagement, motivation, and interest in daily operational & personal life.",
  },
];

const WHO5_OPTIONS = [
  { label: "All of the time", score: 5 },
  { label: "Most of the time", score: 4 },
  { label: "More than half the time", score: 3 },
  { label: "Less than half the time", score: 2 },
  { label: "Some of the time", score: 1 },
  { label: "At no time", score: 0 },
];

export default function PeriodicTestView({ personnelId, userName }: PeriodicTestViewProps) {
  // Test schedule control state (Week 1 = PVT, Week 2 = WHO-5)
  const [selectedWeek, setSelectedWeek] = useState<"week1" | "week2">("week1");
  const [completedTests, setCompletedTests] = useState<Record<string, any>>({});

  // WHO-5 Assessment State
  const [who5Answers, setWho5Answers] = useState<Record<number, number>>({});
  const [who5Submitted, setWho5Submitted] = useState(false);
  const [who5ScoreResult, setWho5ScoreResult] = useState<{ raw: number; pct: number; rating: string } | null>(null);
  const [voiceNoteActive, setVoiceNoteActive] = useState(false);
  const [voiceNoteText, setVoiceNoteText] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // PVT Reaction Test State
  const [pvtStatus, setPvtStatus] = useState<"idle" | "waiting" | "active" | "clicked" | "finished">("idle");
  const [currentTrial, setCurrentTrial] = useState(1);
  const totalTrials = 5;
  const [startTime, setStartTime] = useState<number | null>(null);
  const [trialReactionTimes, setTrialReactionTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [liveCounter, setLiveCounter] = useState(0);
  const [pvtResult, setPvtResult] = useState<{ meanRt: number; minRt: number; lapses: number; grade: string } | null>(null);

  // PVT Timer Refs
  const waitTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const counterTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load saved completed tests from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`veercare_tests_${personnelId}`);
    if (saved) {
      try {
        setCompletedTests(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [personnelId]);

  // Clean up PVT timers on unmount
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      if (counterTimerRef.current) clearInterval(counterTimerRef.current);
    };
  }, []);

  // Determine which test is due this week
  const isWho5DueThisWeek = selectedWeek === "week2";
  const currentWeekKey = `${personnelId}_${selectedWeek}`;
  const isTestCompletedThisWeek = Boolean(completedTests[currentWeekKey]);

  // --- WHO-5 Functions ---
  const handleWho5Select = (qId: number, score: number) => {
    setWho5Answers((prev) => ({ ...prev, [qId]: score }));
  };

  const submitWho5 = () => {
    if (Object.keys(who5Answers).length < 5) return;
    const raw = Object.values(who5Answers).reduce((a, b) => a + b, 0);
    const pct = Math.round((raw / 25) * 100);

    let rating = "Satisfactory Well-Being";
    if (pct < 28) rating = "Critical Low Well-Being (Welfare Support Recommended)";
    else if (pct < 50) rating = "Moderate Low Well-Being (Close Monitoring)";

    const result = { raw, pct, rating };
    setWho5ScoreResult(result);
    setWho5Submitted(true);

    // Save to test completions
    const updated = {
      ...completedTests,
      [currentWeekKey]: {
        type: "WHO-5 Well-Being Index",
        date: new Date().toISOString().split("T")[0],
        score: `${pct}%`,
        details: result,
      },
    };
    setCompletedTests(updated);
    localStorage.setItem(`veercare_tests_${personnelId}`, JSON.stringify(updated));
  };

  // --- PVT Functions ---
  const startNextPvtTrial = () => {
    setPvtStatus("waiting");
    setLiveCounter(0);

    // Random delay between 2.0s and 4.5s
    const randomDelay = Math.floor(Math.random() * 2500) + 2000;
    waitTimerRef.current = setTimeout(() => {
      const now = performance.now();
      setStartTime(now);
      setPvtStatus("active");

      counterTimerRef.current = setInterval(() => {
        setLiveCounter(Math.floor(performance.now() - now));
      }, 16);
    }, randomDelay);
  };

  const handlePvtClick = () => {
    if (pvtStatus === "waiting") {
      // False start! Clicked too early
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      setFalseStarts((prev) => prev + 1);
      setPvtStatus("clicked");
      setTimeout(() => {
        if (currentTrial < totalTrials) {
          setCurrentTrial((prev) => prev + 1);
          startNextPvtTrial();
        } else {
          finishPvtTest([...trialReactionTimes, 500]);
        }
      }, 1000);
      return;
    }

    if (pvtStatus === "active" && startTime) {
      const rt = Math.floor(performance.now() - startTime);
      if (counterTimerRef.current) clearInterval(counterTimerRef.current);
      const updatedTimes = [...trialReactionTimes, rt];
      setTrialReactionTimes(updatedTimes);
      setPvtStatus("clicked");

      if (currentTrial < totalTrials) {
        setTimeout(() => {
          setCurrentTrial((prev) => prev + 1);
          startNextPvtTrial();
        }, 1200);
      } else {
        finishPvtTest(updatedTimes);
      }
    }
  };

  const finishPvtTest = (times: number[]) => {
    const validTimes = times.length > 0 ? times : [320];
    const meanRt = Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
    const minRt = Math.min(...validTimes);
    const lapses = validTimes.filter((t) => t > 500).length;

    let grade = "High Vigilance & Optimal Alertness";
    if (meanRt > 350 || lapses >= 2) grade = "Cognitive Fatigue Spike Detected";
    else if (meanRt > 290 || lapses >= 1) grade = "Moderate Reaction Speed";

    const result = { meanRt, minRt, lapses, grade };
    setPvtResult(result);
    setPvtStatus("finished");

    // Save to test completions
    const updated = {
      ...completedTests,
      [currentWeekKey]: {
        type: "PVT Cognitive Reaction Test",
        date: new Date().toISOString().split("T")[0],
        score: `${meanRt} ms`,
        details: result,
      },
    };
    setCompletedTests(updated);
    localStorage.setItem(`veercare_tests_${personnelId}`, JSON.stringify(updated));
  };

  const resetPvt = () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    if (counterTimerRef.current) clearInterval(counterTimerRef.current);
    setCurrentTrial(1);
    setTrialReactionTimes([]);
    setFalseStarts(0);
    setLiveCounter(0);
    setPvtResult(null);
    setPvtStatus("idle");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Periodic Cycle Selector */}
      <div className="neu-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Periodic Personnel Wellness Tests
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Weekly & Bi-Weekly Schedule
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Mandatory periodic assessments for Armed Forces personnel. Take 1 test per week to monitor reaction alertness & psychological well-being.
              </p>
            </div>
          </div>

          {/* Test Schedule Toggle (Odd/Even Week Simulator) */}
          <div className="flex items-center gap-2 neu-inset p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => { setSelectedWeek("week1"); resetPvt(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedWeek === "week1"
                  ? "neu-btn-active text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Week 1 (PVT Due)</span>
            </button>
            <button
              onClick={() => { setSelectedWeek("week2"); resetPvt(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedWeek === "week2"
                  ? "neu-btn-active text-purple-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Week 2 (WHO-5 Due)</span>
            </button>
          </div>
        </div>

        {/* Access Rules & Active Cycle Notice */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="neu-card-flat p-3.5 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Frequency Constraint:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Personnel can give <strong>1 test per week</strong>. Completed tests lock for 7 days.
              </p>
            </div>
          </div>

          <div className="neu-card-flat p-3.5 flex items-start gap-2.5">
            <Brain className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">PVT Vigilance Test:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Weekly reaction speed test. Active when WHO-5 is not due.
              </p>
            </div>
          </div>

          <div className="neu-card-flat p-3.5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">WHO-5 Well-Being:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Bi-weekly mental health assessment. Takes priority over PVT when due.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETED TEST CARD (If test already completed for selected week) */}
      {isTestCompletedThisWeek && (
        <div className="neu-card p-6 sm:p-8 border-2 border-emerald-500/30 bg-emerald-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Weekly Assessment Completed
                </h3>
                <p className="text-xs text-slate-600 font-mono">
                  Completed for {selectedWeek === "week1" ? "Week 1 Cycle" : "Week 2 Cycle"} · {completedTests[currentWeekKey]?.type}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Score: {completedTests[currentWeekKey]?.score}
            </span>
          </div>

          <div className="neu-card-flat p-4 space-y-2 text-xs text-slate-700">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Assessment Summary & Feedback:</span>
            </div>
            <p className="leading-relaxed">
              {completedTests[currentWeekKey]?.details?.rating || completedTests[currentWeekKey]?.details?.grade || "Test completed successfully."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Next scheduled test opens in 6 days 14 hours</span>
            </div>
            <button
              onClick={() => {
                const copy = { ...completedTests };
                delete copy[currentWeekKey];
                setCompletedTests(copy);
                localStorage.setItem(`veercare_tests_${personnelId}`, JSON.stringify(copy));
                resetPvt();
                setWho5Submitted(false);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Re-take Test Demo
            </button>
          </div>
        </div>
      )}

      {/* TWO TEST PANELS CONTAINER (WHEN NOT YET COMPLETED FOR CURRENT WEEK) */}
      {!isTestCompletedThisWeek && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. WHO-5 WELL-BEING INDEX PANEL */}
          <div
            className={`neu-card p-6 sm:p-7 space-y-5 transition-all relative ${
              isWho5DueThisWeek
                ? "border-2 border-purple-500/40 shadow-lg"
                : "opacity-60 bg-slate-50/50 pointer-events-none"
            }`}
          >
            {/* Status Badge header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  WHO-5 Well-Being Index
                </h3>
              </div>
              {isWho5DueThisWeek ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-600 animate-pulse" />
                  Active This Week (Bi-Weekly)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Locked (Due Next Week)
                </span>
              )}
            </div>

            {/* Lock Overlay Banner if not due */}
            {!isWho5DueThisWeek && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>WHO-5 is conducted bi-weekly. PVT Cognitive Test is active this week.</span>
              </div>
            )}

            {/* WHO-5 Questionnaire Content */}
            {!who5Submitted ? (
              <div className="space-y-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please rate how you have been feeling over the <strong>past 2 weeks</strong> across these 5 well-being statements:
                </p>

                {/* Talk & Audio Guidance Bar */}
                <div className="neu-card-flat p-3.5 flex items-center justify-between text-xs text-slate-700 rounded-xl">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-lg neu-btn flex items-center justify-center text-purple-600"
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? "animate-bounce" : ""}`} />
                    </button>
                    <span>{isPlayingAudio ? "Playing audio guidance..." : "Listen to audio instructions"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVoiceNoteActive(!voiceNoteActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      voiceNoteActive ? "bg-purple-600 text-white" : "neu-btn text-slate-700"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{voiceNoteActive ? "Voice Note On" : "Add Voice Note"}</span>
                  </button>
                </div>

                {voiceNoteActive && (
                  <div className="p-3 rounded-xl neu-inset space-y-2 text-xs">
                    <label className="font-bold text-slate-700 block">Voice Check-in Note (Optional):</label>
                    <textarea
                      value={voiceNoteText}
                      onChange={(e) => setVoiceNoteText(e.target.value)}
                      placeholder="Speak or type how you are feeling in your own words..."
                      className="w-full bg-transparent outline-none text-slate-800 text-xs resize-none h-16 font-mono"
                    />
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-4 pt-1">
                  {WHO5_QUESTIONS.map((q) => (
                    <div key={q.id} className="neu-card-flat p-4 space-y-2.5 rounded-2xl">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {q.id}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{q.question}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{q.description}</p>
                        </div>
                      </div>

                      {/* Options Radio buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                        {WHO5_OPTIONS.map((opt) => {
                          const isSelected = who5Answers[q.id] === opt.score;
                          return (
                            <button
                              key={opt.score}
                              type="button"
                              onClick={() => handleWho5Select(q.id, opt.score)}
                              className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-left transition-all ${
                                isSelected
                                  ? "bg-purple-600 text-white shadow-md scale-[1.02]"
                                  : "neu-btn text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <div>{opt.label}</div>
                              <div className={`text-[9px] font-mono ${isSelected ? "text-purple-200" : "text-slate-400"}`}>
                                {opt.score} pts
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={Object.keys(who5Answers).length < 5}
                  onClick={submitWho5}
                  className="neu-btn-primary w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit WHO-5 Assessment</span>
                </button>
              </div>
            ) : (
              /* WHO-5 Result Summary */
              <div className="space-y-4 pt-2">
                <div className="text-center p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    WHO-5 Well-Being Percentage
                  </div>
                  <div className="text-3xl font-extrabold text-purple-900 font-mono">
                    {who5ScoreResult?.pct}%
                  </div>
                  <div className="text-xs font-bold text-purple-800">
                    {who5ScoreResult?.rating}
                  </div>
                </div>

                <div className="neu-card-flat p-4 space-y-2 text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Score Breakdown:</div>
                  <div className="flex justify-between">
                    <span>Raw Score:</span>
                    <span className="font-mono font-bold">{who5ScoreResult?.raw} / 25 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scaled Score:</span>
                    <span className="font-mono font-bold">{who5ScoreResult?.pct} / 100%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. PVT PSYCHOMOTOR VIGILANCE TEST PANEL */}
          <div
            className={`neu-card p-6 sm:p-7 space-y-5 transition-all relative ${
              !isWho5DueThisWeek
                ? "border-2 border-amber-500/40 shadow-lg"
                : "opacity-60 bg-slate-50/50 pointer-events-none"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  PVT Reaction & Vigilance Test
                </h3>
              </div>
              {!isWho5DueThisWeek ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-600 animate-pulse" />
                  Active This Week (Weekly)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Locked (WHO-5 Priority)
                </span>
              )}
            </div>

            {/* Lock Overlay Banner if WHO-5 is active */}
            {isWho5DueThisWeek && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Locked: WHO-5 Assessment takes priority this week. Personnel can only take 1 test per week.</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Measures visual reaction speed and micro-sleep vigilance lapses caused by operational fatigue.
            </p>

            {/* PVT Interactive Target Screen */}
            <div className="space-y-4">
              <div
                onClick={handlePvtClick}
                className={`w-full h-44 rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all shadow-inner border-2 ${
                  pvtStatus === "idle"
                    ? "bg-slate-100 border-slate-300 hover:border-amber-400"
                    : pvtStatus === "waiting"
                    ? "bg-amber-900/90 border-amber-500 text-amber-100"
                    : pvtStatus === "active"
                    ? "bg-rose-600 border-rose-400 text-white animate-pulse"
                    : pvtStatus === "clicked"
                    ? "bg-emerald-700 border-emerald-500 text-white"
                    : "bg-slate-800 border-slate-700 text-white"
                }`}
              >
                {pvtStatus === "idle" && (
                  <div className="text-center space-y-2 p-4">
                    <Zap className="w-10 h-10 text-amber-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-800">
                      Click Below to Begin 5-Trial Reaction Test
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Watch for the RED target box and click immediately as the counter ticks.
                    </div>
                  </div>
                )}

                {pvtStatus === "waiting" && (
                  <div className="text-center space-y-1">
                    <div className="text-sm font-extrabold text-amber-300 uppercase tracking-widest animate-pulse">
                      WAIT FOR RED TARGET...
                    </div>
                    <div className="text-[11px] text-amber-200/80">
                      Do NOT click early!
                    </div>
                  </div>
                )}

                {pvtStatus === "active" && (
                  <div className="text-center space-y-1">
                    <div className="text-4xl font-black font-mono tracking-wider">
                      {liveCounter} ms
                    </div>
                    <div className="text-xs font-extrabold uppercase tracking-widest text-amber-200">
                      CLICK NOW!
                    </div>
                  </div>
                )}

                {pvtStatus === "clicked" && (
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold font-mono">
                      {trialReactionTimes[trialReactionTimes.length - 1]
                        ? `${trialReactionTimes[trialReactionTimes.length - 1]} ms`
                        : "False Start!"}
                    </div>
                    <div className="text-xs text-emerald-200">
                      Trial {currentTrial} of {totalTrials} Recorded
                    </div>
                  </div>
                )}

                {pvtStatus === "finished" && pvtResult && (
                  <div className="text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-lg font-bold font-mono">
                      Mean RT: {pvtResult.meanRt} ms
                    </div>
                    <div className="text-xs text-emerald-200">{pvtResult.grade}</div>
                  </div>
                )}
              </div>

              {/* Progress & Start Controls */}
              {pvtStatus === "idle" && (
                <button
                  type="button"
                  onClick={startNextPvtTrial}
                  className="neu-btn-primary w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Play className="w-4 h-4" />
                  <span>Start PVT Reaction Test</span>
                </button>
              )}

              {pvtStatus !== "idle" && pvtStatus !== "finished" && (
                <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1">
                  <span>Trial: {currentTrial} / {totalTrials}</span>
                  <span>False Starts: {falseStarts}</span>
                </div>
              )}

              {/* Finished Summary Results Card */}
              {pvtStatus === "finished" && pvtResult && (
                <div className="neu-card-flat p-4 space-y-3 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Vigilance Grade:</span>
                    <span className="text-xs font-bold text-amber-800">{pvtResult.grade}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-xl bg-slate-100">
                      <div className="text-[10px] text-slate-500">Mean RT</div>
                      <div className="text-sm font-bold font-mono text-slate-900">{pvtResult.meanRt} ms</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100">
                      <div className="text-[10px] text-slate-500">Fastest RT</div>
                      <div className="text-sm font-bold font-mono text-emerald-700">{pvtResult.minRt} ms</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100">
                      <div className="text-[10px] text-slate-500">Lapses (&gt;500ms)</div>
                      <div className="text-sm font-bold font-mono text-rose-700">{pvtResult.lapses}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetPvt}
                    className="neu-btn w-full py-2 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try PVT Again</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Log of Previous Weekly Tests */}
      <div className="neu-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Personnel Past Test History Log
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {Object.keys(completedTests).length} Recorded Tests
          </span>
        </div>

        {Object.keys(completedTests).length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2 text-center">
            No periodic tests completed yet. Select Week 1 or Week 2 above to take an assessment.
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(completedTests).map(([key, val]: [string, any]) => (
              <div key={key} className="neu-card-flat p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">{val.type}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Completed: {val.date} · Cycle: {key.split("_")[1]}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-blue-700 font-mono">{val.score}</div>
                  <div className="text-[10px] text-slate-500">{val.details?.grade || val.details?.rating || "Verified"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
