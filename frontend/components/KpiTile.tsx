import React from "react";

interface KpiTileProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: React.ReactNode;
  alert?: boolean;
  accentColor?: string;
  onClick?: () => void;
}

export default function KpiTile({
  label,
  value,
  subtext,
  icon,
  alert = false,
  accentColor = "",
  onClick,
}: KpiTileProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full text-left relative overflow-hidden neu-card p-5 flex flex-col justify-between transition-all ${
        alert ? "border-rose-300 ring-2 ring-rose-300/40" : ""
      } ${
        onClick ? "cursor-pointer hover:shadow-[-6px_-6px_18px_#ffffff,6px_6px_18px_rgba(163,177,198,0.75)] group" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2 w-full">
        <span className="text-xs font-bold text-slate-600 tracking-wider uppercase group-hover:text-slate-900 transition-colors">
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-slate-700 group-hover:text-blue-600 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
          {value}
        </div>
        {subtext && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-snug">{subtext}</p>
        )}
      </div>
    </Component>
  );
}
