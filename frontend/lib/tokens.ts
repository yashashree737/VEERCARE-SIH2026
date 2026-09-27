import { StrainBand, TrendFlag, InterventionType } from "./types";

export const STRAIN_BAND_COLOR: Record<
  StrainBand,
  {
    bg: string;
    text: string;
    border: string;
    hex: string;
    ring: string;
  }
> = {
  Low: {
    bg: "bg-emerald-50 text-emerald-800 shadow-[-2px_-2px_6px_#ffffff,2px_2px_6px_rgba(16,185,129,0.2)]",
    text: "text-emerald-700",
    border: "border-emerald-200",
    hex: "#059669",
    ring: "ring-emerald-400",
  },
  Moderate: {
    bg: "bg-amber-50 text-amber-900 shadow-[-2px_-2px_6px_#ffffff,2px_2px_6px_rgba(217,119,6,0.2)]",
    text: "text-amber-800",
    border: "border-amber-200",
    hex: "#D97706",
    ring: "ring-amber-400",
  },
  High: {
    bg: "bg-orange-50 text-orange-900 shadow-[-2px_-2px_6px_#ffffff,2px_2px_6px_rgba(234,88,12,0.2)]",
    text: "text-orange-800",
    border: "border-orange-200",
    hex: "#EA580C",
    ring: "ring-orange-400",
  },
  Severe: {
    bg: "bg-rose-50 text-rose-900 shadow-[-2px_-2px_6px_#ffffff,2px_2px_6px_rgba(225,29,72,0.25)]",
    text: "text-rose-800",
    border: "border-rose-200",
    hex: "#E11D48",
    ring: "ring-rose-400",
  },
};

export const TREND: Record<
  TrendFlag,
  {
    symbol: string;
    color: string;
    hex: string;
    label: string;
  }
> = {
  Rising: {
    symbol: "▲",
    color: "text-rose-600",
    hex: "#E11D48",
    label: "Rising",
  },
  Stable: {
    symbol: "–",
    color: "text-slate-500",
    hex: "#64748B",
    label: "Stable",
  },
  Improving: {
    symbol: "▼",
    color: "text-emerald-600",
    hex: "#059669",
    label: "Improving",
  },
};

export const INTERVENTION_URGENCY: InterventionType[] = [
  "Immediate Welfare Escalation",
  "Counselling Referral",
  "Counselling Session",
  "Unit Medical Referral",
  "Medical Referral",
  "Priority Leave Grant",
  "Workload Rebalancing",
  "Family Liaison Support",
  "Peer Buddy Assignment",
  "No Action",
];
