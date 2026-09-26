"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { routesForRole } from "@/lib/nav";
import {
  Shield,
  Activity,
  User,
  Users,
  ArrowRightLeft,
  Download,
  LogOut,
  Lock,
  Menu,
  X,
  WifiOff,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isStub, setIsStub] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => { });
    }

    // Offline / Online listeners
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Escape key closes mobile menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // PWA install prompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Fetch model metrics to check is_stub
    api
      .getMetrics()
      .then((m) => setIsStub(Boolean(m.is_stub)))
      .catch(() => setIsStub(false));

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navRoutes = routesForRole(user);

  const getRoleBadge = () => {
    if (!isAuthenticated || !user) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold neu-card-flat text-slate-600">
          <Lock className="w-3.5 h-3.5" />
          Unauthenticated
        </span>
      );
    }
    if (user.role === "admin") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold neu-card-flat text-amber-900 border border-amber-300/60">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          Prototype Master (Full Access)
        </span>
      );
    }
    if (user.role === "commander") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold neu-card-flat text-indigo-900 border border-indigo-200">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          {user.name} ({user.unit_id || "Command"})
        </span>
      );
    }
    if (user.role === "personnel") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold neu-card-flat text-emerald-900 border border-emerald-200">
          <User className="w-3.5 h-3.5 text-emerald-600" />
          {user.name} ({user.personnel_id})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold neu-card-flat text-blue-900 border border-blue-200">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        {user.name} (Welfare)
      </span>
    );
  };

  return (
    <>
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 text-center shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — displaying cached operational records</span>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-[#f0f3f8]/95 backdrop-blur-md border-b border-white/60 shadow-[0_4px_12px_rgba(163,177,198,0.35)] text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Hamburger Button for Mobile (< md) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl neu-btn text-slate-700 hover:text-slate-950 focus-visible transition-all flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/logo.jpeg" alt="VeerCare Logo" className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md text-white group-hover:scale-105 transition-transform" width={36} height={36} />
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  VeerCare
                </span>
                <p className="text-xs text-slate-500 hidden sm:block">Personnel Welfare & Early Warning</p>
              </div>
            </Link>

            {/* Desktop Navigation Links (Normal Desktop Navbar) */}
            {isAuthenticated && user && (
              <nav className="hidden md:flex items-center gap-2">
                {navRoutes.map((r) => {
                  const isActive = pathname === r.href.split("?")[0];
                  return (
                    <Link
                      key={r.href}
                      href={r.href}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${isActive
                        ? "neu-btn-active font-bold text-blue-600"
                        : "text-slate-600 hover:text-slate-900 hover:neu-card-flat font-medium"
                        }`}
                    >
                      {r.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Desktop Controls (Hidden/compact on small mobile) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Amber Demo model chip */}
            {isStub && (
              <span
                id="demo-model-chip"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold neu-card-flat text-amber-900 border border-amber-300/60"
                title="Artifacts generated by stub pipeline"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Demo model
              </span>
            )}

            {/* PWA Install Button */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-xl neu-btn-primary"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install PWA</span>
              </button>
            )}

            {/* Active Role Chip & Auth Actions */}
            <div className="flex items-center gap-2">
              {getRoleBadge()}

              {isAuthenticated ? (
                <>
                  <Link
                    href="/"
                    className="text-xs text-slate-700 hover:text-slate-950 flex items-center gap-1 px-2.5 py-1.5 rounded-xl neu-btn font-medium transition-all"
                    title="Switch user account"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1.5 rounded-xl neu-btn font-medium transition-all"
                    title="Sign out from session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/"
                  className="text-xs font-bold neu-btn-primary px-3 py-1.5 flex items-center gap-1"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Navigation Menu (< md) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-[#f0f3f8] px-4 py-4 space-y-4 shadow-2xl animate-fade-in">
            {/* Mobile Navigation Links */}
            {isAuthenticated && user && navRoutes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  Navigation Menu
                </p>
                <nav className="space-y-1">
                  {navRoutes.map((r) => {
                    const isActive = pathname === r.href.split("?")[0];
                    return (
                      <Link
                        key={r.href}
                        href={r.href}
                        className={`block px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                          ? "neu-btn-active font-bold text-blue-600"
                          : "text-slate-700 hover:text-slate-950 neu-btn"
                          }`}
                      >
                        {r.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Mobile Account Details & Actions */}
            <div className="pt-2 border-t border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Account Status
                </span>
                {isStub && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Demo model
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 bg-white/40 p-2.5 rounded-xl border border-white/60 shadow-sm">
                {getRoleBadge()}

                {isAuthenticated ? (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/"
                      className="text-xs text-slate-700 hover:text-slate-950 p-2 rounded-lg neu-btn"
                      title="Switch account"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-rose-600 hover:text-rose-700 p-2 rounded-lg neu-btn"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/"
                    className="text-xs font-bold neu-btn-primary px-3 py-1.5"
                  >
                    Sign In
                  </Link>
                )}
              </div>

              {installPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl neu-btn-primary"
                >
                  <Download className="w-4 h-4" />
                  <span>Install PWA Web App</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
