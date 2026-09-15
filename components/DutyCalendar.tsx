"use client";

import React, { useState } from "react";
import { RosterRow } from "@/lib/types";
import { Calendar, Clock, MapPin } from "lucide-react";

interface DutyCalendarProps {
  roster: RosterRow[];
  dailyAvailable: boolean;
  tier: string;
}

export default function DutyCalendar({
  roster,
  dailyAvailable,
  tier,
}: DutyCalendarProps) {
  const [activeDay, setActiveDay] = useState<RosterRow | null>(null);

  if (!dailyAvailable || roster.length === 0) {
    return (
      <div className="neu-card p-6 space-y-2">
        <h3 className="text-base font-bold text-slate-900">365-Day Operational Duty Register</h3>
        <div className="neu-inset p-4 text-sm text-slate-700">
          <span className="font-bold text-slate-900">Note: </span>
          Detailed 365-day roster telemetry is tracked for the Daily Telemetry Cohort (Tier 1). Personnel under {tier} are monitored via validated monthly HR rollups.
        </div>
      </div>
    );
  }

  const days = [...roster].sort(
    (a, b) => new Date(a.duty_date).getTime() - new Date(b.duty_date).getTime()
  );

  const restCount = days.filter((d) => d.is_rest_day === 1 || d.duty_type === "Rest Day").length;
  const leaveCount = days.filter((d) => d.is_leave_day === 1 || d.duty_type === "On Leave").length;
  const sickCount = days.filter((d) => d.is_sick_report === 1 || d.duty_type === "Sick Report").length;
  const absentCount = days.filter((d) => d.is_unplanned_absence === 1 || d.duty_type.toLowerCase().includes("absent")).length;
  const dutyCount = days.length - restCount - leaveCount - sickCount - absentCount;

  const getCellColor = (row: RosterRow) => {
    if (row.is_unplanned_absence === 1 || row.duty_type.toLowerCase().includes("absent")) {
      return "bg-rose-600 border-rose-500";
    }
    if (row.is_sick_report === 1 || row.duty_type === "Sick Report") {
      return "bg-amber-500 border-amber-400";
    }
    if (row.is_leave_day === 1 || row.duty_type === "On Leave") {
      return "bg-emerald-600 border-emerald-500";
    }
    if (row.is_rest_day === 1 || row.duty_type === "Rest Day") {
      return "bg-blue-600 border-blue-500";
    }

    const h = row.hours_worked || 0;
    if (h >= 14) return "bg-gray-900 border-gray-950";
    if (h >= 10) return "bg-gray-700 border-gray-700";
    if (h >= 6) return "bg-gray-500 border-gray-500";
    if (h > 0) return "bg-gray-300 border-gray-300";
    return "bg-gray-100 border-gray-200";
  };

  const firstDate = new Date(days[0].duty_date + "T12:00:00Z");
  const firstDow = (firstDate.getUTCDay() + 6) % 7;

  const weeks: (RosterRow | null)[][] = [];
  let currentWeek: (RosterRow | null)[] = [];

  for (let i = 0; i < firstDow; i++) {
    currentWeek.push(null);
  }

  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = -1;

  days.forEach((day) => {
    const d = new Date(day.duty_date + "T12:00:00Z");
    const m = d.getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      monthLabels.push({
        index: weeks.length,
        label: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="neu-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            365-Day Duty & Shift Activity Register
          </h3>
          <p className="text-xs text-slate-600 font-medium mt-1">
            <span className="text-indigo-800 font-bold">{dutyCount} duty days</span> ·{" "}
            <span className="text-blue-800 font-bold">{restCount} rest</span> ·{" "}
            <span className="text-emerald-800 font-bold">{leaveCount} leave</span> ·{" "}
            <span className="text-amber-900 font-bold">{sickCount} sick</span> ·{" "}
            <span className="text-rose-800 font-bold">{absentCount} absent / lapse</span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span>Rest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Sick</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />
            <span>&lt;6h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-500" />
            <span>6–10h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-700" />
            <span>10–14h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-900" />
            <span>14h+</span>
          </div>
        </div>
      </div>

      {/* Active Day Detail Banner */}
      <div className="p-3 rounded-xl neu-inset text-xs min-h-[44px] flex items-center justify-between">
        {activeDay ? (
          <div className="flex flex-wrap items-center gap-4 text-slate-800 font-medium">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {activeDay.duty_date} ({activeDay.day_of_week})
            </span>
            <span>
              Duty: <strong className="text-blue-700">{activeDay.duty_type}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Hours: <strong className="text-slate-900">{activeDay.hours_worked}h</strong>
              {activeDay.overtime_hours > 0 && (
                <span className="text-amber-800 font-bold"> (+{activeDay.overtime_hours}h OT)</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {activeDay.deployment_zone}
            </span>
            {activeDay.is_high_risk_duty === 1 && (
              <span className="text-rose-700 font-bold">High-Risk Post</span>
            )}
            {activeDay.is_night_duty === 1 && (
              <span className="text-indigo-700 font-bold">Night Duty</span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 italic">
            Hover or keyboard focus any cell to inspect shift telemetry, duty hours, and zone assignment.
          </span>
        )}
      </div>

      {/* Grid container with weekday labels & month header */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[780px]">
          {/* Month labels */}
          <div className="flex text-xs text-slate-600 font-bold mb-1 pl-7">
            {weeks.map((_, wIdx) => {
              const mLabel = monthLabels.find((m) => m.index === wIdx);
              return (
                <div key={wIdx} className="w-[17px] shrink-0">
                  {mLabel ? mLabel.label : ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1.5 items-start">
            {/* Weekday labels */}
            <div className="flex flex-col justify-between h-[116px] text-xs text-slate-500 font-mono pr-1 select-none pt-0.5">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Columns of days */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((d, dIdx) => {
                    if (!d) {
                      return (
                        <div
                          key={`empty-${wIdx}-${dIdx}`}
                          className="w-3.5 h-3.5 rounded-[3px] bg-transparent opacity-0 pointer-events-none"
                        />
                      );
                    }

                    const colorCls = getCellColor(d);
                    const labelText = `${d.duty_date} (${d.day_of_week}): ${d.duty_type}, ${d.hours_worked}h worked`;

                    return (
                      <button
                        type="button"
                        key={d.duty_date}
                        tabIndex={0}
                        aria-label={labelText}
                        onMouseEnter={() => setActiveDay(d)}
                        onMouseLeave={() => setActiveDay(null)}
                        onFocus={() => setActiveDay(d)}
                        onBlur={() => setActiveDay(null)}
                        className={`w-3.5 h-3.5 rounded-[3px] transition-transform hover:scale-125 focus:scale-125 focus:ring-2 focus:ring-blue-500 focus:z-10 cursor-pointer ${colorCls}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
