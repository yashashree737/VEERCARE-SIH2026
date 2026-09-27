"use client";

/**
 * VeerCare Voice Companion (VEER).
 * A floating action button (bottom-right, global) that opens a voice-driven
 * companion. Uses the browser Web Speech API for speech-to-text, POSTs the
 * transcript to the n8n "process-audio" companion workflow, and plays back the
 * spoken audio reply the workflow returns. This is a general wellbeing
 * companion — it is NOT tied to the situational scenarios (that is a separate
 * agent in SituationalAssessmentChat). Styled to match the neumorphic light
 * theme (#f0f3f8, neu-* tokens).
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Mic, Bot, User, Volume2, ShieldCheck, RefreshCw, BrainCircuit, LifeBuoy } from "lucide-react";

// n8n "process-audio" companion workflow. Sends { question, sessionId, language,
// soldierId }, returns an audio blob (spoken reply) + optional X-Crisis header.
const VOICE_WEBHOOK_URL =
    process.env.NEXT_PUBLIC_VEER_VOICE_WEBHOOK ||
    "https://atharvjagtap.app.n8n.cloud/webhook/process-audio";

type Lang = "en-IN" | "hi-IN";

// Auto-send this long after the user stops speaking. People pause mid-thought
// when sharing hard things — 1s is snappy; bump if it cuts users off.
// ponytail: fixed pause threshold, make it a setting only if users complain.
const SILENCE_MS = 1000;

interface VoiceMessage {
    id: string;
    sender: "ai" | "soldier";
    text?: string; // soldier: transcript. ai: none (reply is audio).
    audioUrl?: string; // ai only: object URL for replay.
}

// Web Speech API is not in the TS DOM lib; access it loosely.
function getRecognitionCtor(): any {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export default function VoiceAgent() {
    const { user, isAuthenticated } = useAuth();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);
    const [supported, setSupported] = useState(true);
    const [listening, setListening] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [interim, setInterim] = useState("");
    const [textInput, setTextInput] = useState("");
    const [lang, setLang] = useState<Lang>("en-IN");
    const [crisis, setCrisis] = useState(false);
    const [messages, setMessages] = useState<VoiceMessage[]>([]);

    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>("");
    const silenceTimeoutRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionIdRef = useRef<string>("");
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // Stable session id per browser (mirrors the companion orb's sessionStorage use).
    useEffect(() => {
        try {
            let s = sessionStorage.getItem("veerSession");
            if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("veerSession", s); }
            sessionIdRef.current = s;
        } catch {
            sessionIdRef.current = crypto.randomUUID();
        }
        setSupported(Boolean(getRecognitionCtor()));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, interim, thinking]);

    // Cleanup on unmount: stop mic + any audio, and free blob URLs.
    useEffect(() => {
        return () => {
            clearTimeout(silenceTimeoutRef.current);
            try { recognitionRef.current?.abort?.(); } catch { }
            try { audioRef.current?.pause(); } catch { }
            messages.forEach((m) => m.audioUrl && URL.revokeObjectURL(m.audioUrl));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopAudio = () => {
        try { audioRef.current?.pause(); } catch { }
        setSpeaking(false);
    };

    const playAudio = (url: string) => {
        try {
            audioRef.current?.pause();
            const a = new Audio(url);
            audioRef.current = a;
            a.onplay = () => setSpeaking(true);
            a.onended = () => setSpeaking(false);
            a.onerror = () => setSpeaking(false);
            a.play().catch(() => setSpeaking(false));
        } catch {
            setSpeaking(false);
        }
    };

    const openPanel = () => setOpen(true);

    const closePanel = () => {
        stopListening();
        stopAudio();
        setOpen(false);
    };

    const sendResponse = async (raw: string) => {
        const text = raw.trim();
        if (!text || thinking) return;

        setMessages((prev) => [...prev, { id: `s-${Date.now()}`, sender: "soldier", text }]);
        setTextInput("");
        setThinking(true);

        try {
            const res = await fetch(VOICE_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: text,
                    sessionId: sessionIdRef.current,
                    language: lang,
                    soldierId: user?.personnel_id || "anon",
                }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            // Header only readable if n8n exposes it via Access-Control-Expose-Headers.
            if (res.headers.get("X-Crisis") === "true") setCrisis(true);

            const url = URL.createObjectURL(await res.blob());
            setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: "ai", audioUrl: url }]);
            playAudio(url);
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: `a-${Date.now()}`, sender: "ai", text: "Couldn't reach VEER. Please try again in a moment." },
            ]);
        } finally {
            setThinking(false);
        }
    };

    const startListening = () => {
        const Ctor = getRecognitionCtor();
        if (!Ctor) { setSupported(false); return; }
        stopAudio();
        finalTranscriptRef.current = "";
        setInterim("");

        const rec = new Ctor();
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (e: any) => {
            let interimText = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const chunk = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalTranscriptRef.current += chunk + " ";
                else interimText += chunk;
            }
            setInterim(interimText);
            // Any speech resets the "quiet" timer; 1s of silence = done → send.
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => stopListening(), SILENCE_MS);
        };
        rec.onerror = () => setListening(false);
        rec.onend = () => {
            setListening(false);
            const finalText = finalTranscriptRef.current.trim();
            setInterim("");
            if (finalText) sendResponse(finalText);
        };

        recognitionRef.current = rec;
        try {
            rec.start();
            setListening(true);
        } catch {
            setListening(false);
        }
    };

    const stopListening = () => {
        clearTimeout(silenceTimeoutRef.current);
        try { recognitionRef.current?.stop(); } catch { }
        setListening(false);
    };

    const toggleMic = () => (listening ? stopListening() : startListening());

    const isPersonnel = user?.role?.toLowerCase() === "personnel";
    if (!isAuthenticated || !user || !isPersonnel || pathname === "/") return null;

    const statusLabel = listening
        ? "Listening… tap to stop"
        : thinking
            ? "Thinking…"
            : speaking
                ? "VEER is speaking…"
                : "Tap the mic and share whatever is on your mind";

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Panel */}
            {open && (
                <div className="w-[92vw] max-w-sm neu-card rounded-3xl p-4 flex flex-col animate-fade-in" style={{ maxHeight: "72vh" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-xl neu-inset text-blue-600 shrink-0">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-section-title text-slate-900 truncate">VEER Companion</h3>
                                <div className="flex items-center gap-1 text-metadata font-bold text-emerald-800">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Confidential · always here for you</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={closePanel}
                            aria-label="Close VEER companion"
                            className="neu-btn w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 text-lg leading-none shrink-0"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Language toggle */}
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-metadata font-bold uppercase tracking-wider text-slate-500">Language</span>
                        {([["en-IN", "English"], ["hi-IN", "हिंदी"]] as [Lang, string][]).map(([code, label]) => (
                            <button
                                key={code}
                                onClick={() => setLang(code)}
                                className={`px-3 py-1 rounded-lg text-metadata font-bold transition-all ${lang === code ? "neu-btn-active text-blue-700 ring-2 ring-blue-400/40" : "neu-btn text-slate-600"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Crisis banner */}
                    {crisis && (
                        <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2">
                            <LifeBuoy className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <p className="text-metadata leading-relaxed">
                                You are not alone. Please reach your unit welfare officer or the 24×7 helpline now.
                            </p>
                        </div>
                    )}

                    {/* Transcript */}
                    <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 scrollbar-thin" style={{ minHeight: "140px" }}>
                        {messages.length === 0 && (
                            <p className="text-body-secondary text-slate-500 text-center px-4 pt-6">
                                Tap the mic below and talk to VEER. Whatever you say stays confidential.
                            </p>
                        )}
                        {messages.map((m) => (
                            <div key={m.id} className={`flex items-start gap-2 ${m.sender === "soldier" ? "flex-row-reverse" : "flex-row"}`}>
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.sender === "soldier" ? "bg-blue-600 text-white" : "neu-card text-blue-600"
                                        }`}
                                >
                                    {m.sender === "soldier" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                </div>
                                <div
                                    className={`p-3 rounded-2xl text-body-secondary leading-relaxed max-w-[78%] ${m.sender === "soldier"
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "neu-card text-slate-900 rounded-tl-none border border-slate-200/80"
                                        }`}
                                >
                                    {m.sender === "ai" && m.audioUrl ? (
                                        <button
                                            onClick={() => playAudio(m.audioUrl!)}
                                            className="flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                            <span>Replay VEER’s reply</span>
                                        </button>
                                    ) : (
                                        <p className="whitespace-pre-line">{m.text}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Live interim transcript while listening */}
                        {listening && interim && (
                            <div className="flex items-start gap-2 flex-row-reverse">
                                <div className="w-7 h-7 rounded-full bg-blue-600/60 text-white flex items-center justify-center shrink-0">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <div className="p-3 rounded-2xl rounded-tr-none bg-blue-600/50 text-white text-body-secondary max-w-[78%] italic">
                                    {interim}
                                </div>
                            </div>
                        )}

                        {thinking && (
                            <div className="flex items-center gap-2 text-metadata text-slate-600">
                                <div className="w-7 h-7 rounded-full neu-card text-blue-600 flex items-center justify-center shrink-0">
                                    <Bot className="w-3.5 h-3.5" />
                                </div>
                                <span className="flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                    VEER is thinking…
                                </span>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Controls */}
                    <div className="pt-2 border-t border-slate-200/60">
                        {supported ? (
                            <div className="flex flex-col items-center gap-2 pt-2">
                                <button
                                    onClick={toggleMic}
                                    disabled={thinking}
                                    aria-label={listening ? "Stop listening" : "Start speaking"}
                                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${listening ? "bg-rose-600 text-white shadow-lg" : "neu-btn-primary"
                                        }`}
                                >
                                    {listening && <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />}
                                    <Mic className="w-6 h-6 relative" />
                                </button>
                                <span className="text-metadata font-medium text-slate-600 text-center">{statusLabel}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendResponse(textInput); }
                                    }}
                                    placeholder="Voice not supported — type to VEER…"
                                    disabled={thinking}
                                    className="flex-1 p-2.5 neu-inset rounded-xl text-body-secondary text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
                                />
                                <button
                                    onClick={() => sendResponse(textInput)}
                                    disabled={thinking || !textInput.trim()}
                                    className="neu-btn-primary px-4 py-2.5 rounded-xl font-bold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={open ? closePanel : openPanel}
                aria-label={open ? "Close VEER companion" : "Open VEER companion"}
                className="relative w-14 h-14 rounded-full neu-btn-primary flex items-center justify-center shrink-0 self-end"
            >
                {!open && (speaking || listening) && (
                    <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />
                )}
                {open ? <span className="text-2xl leading-none relative">✕</span> : <Mic className="w-6 h-6 relative" />}
            </button>
        </div>
    );
}