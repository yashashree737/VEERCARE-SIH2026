"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { landingRoute } from "@/lib/nav";
import {
  ArrowRight,
  Activity,
  Lock,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  Eye,
  EyeOff,
  RefreshCw,
  Heart,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

function RoleAuthenticationPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, login, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextUrl = searchParams.get("next");

  const redirectAfterAuth = (authUser: any) => {
    if (nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")) {
      if (authUser.role === "personnel" && nextUrl.startsWith("/dashboard")) {
        router.push(`/personnel/${authUser.personnel_id || "P0013"}`);
        return;
      }
      router.push(nextUrl);
      return;
    }

    if (authUser.role === "commander") {
      router.push(`/dashboard?unit=${authUser.unit_id || "U012"}`);
      return;
    }
    if (authUser.role === "personnel") {
      router.push(`/personnel/${authUser.personnel_id || "P0013"}`);
      return;
    }
    if (authUser.role === "welfare" || authUser.role === "system") {
      router.push("/dashboard?scope=flagged");
      return;
    }
    router.push("/dashboard");
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both your Service ID / Username and Password / PIN.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authUser = await login(username.trim(), password.trim());
      redirectAfterAuth(authUser);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please verify credentials.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4">
      {/* Top Header - Welcoming & Friendly */}
      <div className="text-center max-w-2xl mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold neu-card-flat text-emerald-800 border border-emerald-200 mb-3 shadow-sm">
          <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
          <span>VeerCare · Indian Armed Forces Welfare & Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Welcome to VeerCare
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
          A confidential, warm, and friendly home for our brave Jawans and Officers. Check in with yourself, explore situational scenarios with your AI companion, or view your schedule in complete privacy.
        </p>

        {/* Friendly Reassurance Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-card-flat text-slate-700">
            <Lock className="w-3 h-3 text-blue-600" />
            100% Confidential
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-card-flat text-slate-700">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Friendly AI Companion
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-card-flat text-slate-700">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Safe & Supportive
          </span>
        </div>
      </div>

      {/* Active Session Notice if already logged in */}
      {isAuthenticated && user && (
        user.role === "personnel" ? (
          <div className="w-full max-w-md mb-5 neu-card p-5 space-y-3 text-slate-800">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-emerald-600 shrink-0">
                <Heart className="w-5 h-5 fill-emerald-100 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Jai Hind! · welcome {user.personnel_id || user.name}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your private wellness companion is ready. Welcome back to your safe space.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => redirectAfterAuth(user)}
                className="neu-btn-primary flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Open My Wellness Space</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={logout}
                className="neu-btn px-3 py-2.5 text-xs text-rose-600 hover:text-rose-800 font-semibold rounded-xl"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md mb-5 neu-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-800">
                  Active Session: <strong className="text-slate-900">{user.name}</strong>
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Role: {user.role.toUpperCase()} {user.unit_id ? `· Unit: ${user.unit_id}` : ""} {user.personnel_id ? `· ID: ${user.personnel_id}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => redirectAfterAuth(user)}
                className="neu-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1"
              >
                <span>Enter</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={logout}
                className="neu-btn px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        )
      )}

      {/* Error Message */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="w-full max-w-md mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2.5 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Single Standard Login Box Card in Neumorphic Style */}
      <div className="w-full max-w-md neu-card p-6 sm:p-8 space-y-5">
        {/* Card Header */}
        <div className="text-center space-y-1.5 pb-1">
          <div className="w-11 h-11 rounded-2xl neu-inset flex items-center justify-center text-blue-600 mx-auto mb-2 shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Sign In to Your Space
          </h2>
          <p className="text-xs text-slate-500">
            Enter your Service ID (e.g. P0013) or Officer Credentials below
          </p>
        </div>

        {/* Standard Single Login Form (Username Box + Password Box + Sign-in Button) */}
        <form onSubmit={handleManualLogin} className="space-y-4 pt-1">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Service ID / Username:
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. P0013, CDR-U012, WO-DELHI"
              className="w-full neu-inset px-4 py-3 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              required
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Password / Security PIN:
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full neu-inset pl-4 pr-11 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn-primary w-full py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md mt-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In & Enter Space</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Shortcuts */}
        <div className="pt-4 border-t border-slate-200/60 text-center space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setUsername("P1001"); setPassword("password123"); }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium text-left"
            >
              <div className="font-bold">Soldier</div>
              <div className="text-[10px] text-emerald-600 font-mono">ID: P1001</div>
            </button>

            <button
              type="button"
              onClick={() => { setUsername("C1001"); setPassword("password123"); }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors font-medium text-left"
            >
              <div className="font-bold">Commander</div>
              <div className="text-[10px] text-blue-600 font-mono">ID: C1001</div>
            </button>

            <button
              type="button"
              onClick={() => { setUsername("W1001"); setPassword("password123"); }}
              className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors font-medium text-left"
            >
              <div className="font-bold">Welfare Officer</div>
              <div className="text-[10px] text-purple-600 font-mono">ID: W1001</div>
            </button>

            <button
              type="button"
              onClick={() => { setUsername("HR-001"); setPassword("securepassword123"); }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors font-medium text-left"
            >
              <div className="font-bold">HR Officer</div>
              <div className="text-[10px] text-amber-600 font-mono">ID: HR-001</div>
            </button>
          </div>
        </div>
      </div>

      {/* Role Routing Guarantee Notice */}
      <div className="flex items-center gap-2 text-xs text-slate-600 neu-card-flat px-4 py-2.5 rounded-full mt-6 shadow-sm max-w-md text-center justify-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Confidential & Secure · Indian Armed Forces Stress & Welfare Initiative</span>
      </div>
    </div>
  );
}

export default function RoleAuthenticationPortal() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Loading authentication portal...</p>
        </div>
      }
    >
      <RoleAuthenticationPortalContent />
    </Suspense>
  );
}
