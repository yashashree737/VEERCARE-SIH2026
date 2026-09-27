"use client";

import React, { useState, useEffect } from "react";
import { RosterRow } from "@/lib/types";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  PlusCircle,
  Send,
  X,
  ShieldCheck,
} from "lucide-react";

interface DutyCalendarProps {
  roster: RosterRow[];
  dailyAvailable: boolean;
  tier: string;
  personnelId?: string;
}

export interface LeaveApplication {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: "Approved" | "Rejected" | "Pending";
  approvedBy: string;
  remarks: string;
  submittedDate: string;
}

const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: "LV-2026-089",
    leaveType: "Earned Leave",
    startDate: "2026-09-10",
    endDate: "2026-09-24",
    daysCount: 14,
    reason: "Annual family agricultural harvest & domestic responsibilities in home village.",
    status: "Approved",
    approvedBy: "Cmdr. Vikram Rathore (Unit Commandant)",
    remarks: "Sanctioned under Armed Forces Welfare Policy §12. Operational shift substitute assigned (HC Ramesh Kumar).",
    submittedDate: "2026-08-28",
  },
  {
    id: "LV-2026-042",
    leaveType: "Emergency Leave",
    startDate: "2026-07-15",
    endDate: "2026-07-22",
    daysCount: 7,
    reason: "Emergency home visit for father's hospitalisation & medical procedure.",
    status: "Approved",
    approvedBy: "Welfare Officer Anita Deshmukh",
    remarks: "Priority emergency travel pass issued with travel allowance.",
    submittedDate: "2026-07-14",
  },
  {
    id: "LV-2026-015",
    leaveType: "Casual Leave",
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    daysCount: 4,
    reason: "Personal domestic affair and property documentation.",
    status: "Rejected",
    approvedBy: "12th Bn Duty Officer",
    remarks: "Regrettably rejected due to active High Hardship deployment & minimum troop strength threshold in Sector Alpha. Reschedule recommended for Oct 2026.",
    submittedDate: "2026-05-25",
  },
];

export default function DutyCalendar({
  roster,
  dailyAvailable,
  tier,
  personnelId = "P1001",
}: DutyCalendarProps) {
  const [activeDay, setActiveDay] = useState<RosterRow | null>(null);

  // Leave Platform State
  const [leaves, setLeaves] = useState<LeaveApplication[]>(INITIAL_LEAVE_APPLICATIONS);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Earned Leave");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-10");
  const [reason, setReason] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load persistent leaves from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`veercare_leaves_${personnelId}`);
    if (saved) {
      try {
        setLeaves(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [personnelId]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newLeave: LeaveApplication = {
      id: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      status: "Pending",
      approvedBy: "Under Unit Command Review",
      remarks: "Forwarded to Unit Commandant for operational clearance & shift substitution review. Decision expected within 24-48 hours.",
      submittedDate: new Date().toISOString().split("T")[0],
    };

    const updated = [newLeave, ...leaves];
    setLeaves(updated);
    localStorage.setItem(`veercare_leaves_${personnelId}`, JSON.stringify(updated));

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowApplyModal(false);
      setReason("");
    }, 1500);
  };

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

  const days = [...roster].sort(
    (a, b) => new Date(a.duty_date).getTime() - new Date(b.duty_date).getTime()
  );

  const firstDate = days.length > 0 ? new Date(days[0].duty_date + "T12:00:00Z") : new Date();
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
    <div className="space-y-6">

      {/* 1. TOP SECTION: 365-DAY SHIFT REGISTER & CALENDAR GRID */}
      <div className="neu-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              365-Day Shift & Duty Activity Grid
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Hover or tap any date cell to view shift details, hours worked, and deployment zone.
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
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-700" />
              <span>10h+</span>
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
            </div>
          ) : (
            <span className="text-slate-500 italic">
              Hover or keyboard focus any cell to inspect shift telemetry, duty hours, and zone assignment.
            </span>
          )}
        </div>

        {/* Grid container */}
        {dailyAvailable && roster.length > 0 && (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[780px]">
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
                <div className="flex flex-col justify-between h-[116px] text-xs text-slate-500 font-mono pr-1 select-none pt-0.5">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                  <span>Sun</span>
                </div>

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
                        return (
                          <button
                            type="button"
                            key={d.duty_date}
                            tabIndex={0}
                            aria-label={`${d.duty_date}: ${d.duty_type}`}
                            onMouseEnter={() => setActiveDay(d)}
                            onMouseLeave={() => setActiveDay(null)}
                            onFocus={() => setActiveDay(d)}
                            onBlur={() => setActiveDay(null)}
                            className={`w-3.5 h-3.5 rounded-[3px] transition-transform hover:scale-125 focus:scale-125 focus:ring-2 focus:ring-blue-500 cursor-pointer ${colorCls}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. BOTTOM SECTION: LIVE LEAVE APPLICATIONS & APPROVAL TIMELINE PLATFORM */}
      <div className="neu-card p-6 sm:p-7 space-y-6 border-2 border-emerald-500/30 bg-emerald-50/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl neu-inset flex items-center justify-center text-emerald-600 shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Live Leave Applications & Command Approval Timeline</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Real-Time Platform
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Track status of submitted leave requests, approval decisions, and Command remarks in sequential timeline order.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            className="neu-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* FLOWBITE TIMELINE DESIGN IMPLEMENTATION */}
        <ol className="relative border-s border-slate-300/80 ml-3 sm:ml-4 space-y-7 my-2">
          {leaves.map((item) => {
            const isApproved = item.status === "Approved";
            const isRejected = item.status === "Rejected";
            const isPending = item.status === "Pending";

            return (
              <li key={item.id} className="ms-6 relative group">
                {/* Timeline Bullet Dot */}
                <div
                  className={`absolute w-3.5 h-3.5 rounded-full mt-1.5 -start-[25px] border-2 border-white transition-transform group-hover:scale-125 ${
                    isApproved
                      ? "bg-emerald-500 shadow-xs ring-2 ring-emerald-200"
                      : isRejected
                      ? "bg-rose-500 shadow-xs ring-2 ring-rose-200"
                      : "bg-amber-400 shadow-xs ring-2 ring-amber-200 animate-pulse"
                  }`}
                />

                {/* Date & Time metadata */}
                <time className="text-xs font-mono font-semibold text-slate-500 flex flex-wrap items-center gap-2">
                  <span>
                    {item.startDate} to {item.endDate} ({item.daysCount} Days)
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">Submitted: {item.submittedDate}</span>
                </time>

                {/* Title & Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 my-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2.5">
                    <span>{item.leaveType}</span>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {item.id}
                    </span>
                  </h3>

                  <div className="flex items-center gap-2">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approved & Sanctioned
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Request Declined
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        Under Command Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason description */}
                <p className="mb-3 text-xs font-normal text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Reason: </strong>
                  <span className="italic text-slate-600">&ldquo;{item.reason}&rdquo;</span>
                </p>

                {/* Command Approval Remarks Box */}
                <div
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    isApproved
                      ? "bg-emerald-50/80 border border-emerald-200 text-emerald-950"
                      : isRejected
                      ? "bg-rose-50/80 border border-rose-200 text-rose-950"
                      : "bg-amber-50/80 border border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-slate-700" />
                    <span>Command Decision & Remarks ({item.approvedBy}):</span>
                  </div>
                  <p className="leading-relaxed pl-5 text-[11px] sm:text-xs text-slate-800">{item.remarks}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 3. APPLY FOR LEAVE MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="neu-card p-6 sm:p-8 max-w-md w-full space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Submit New Leave Application
              </h3>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs text-center space-y-2 font-bold">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>Leave Application Submitted Successfully!</div>
                <div className="text-[11px] font-normal text-emerald-700">
                  Forwarded to Unit Commandant & Welfare Cell for operational clearance.
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Type:</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full neu-inset px-3 py-2 text-xs font-bold text-slate-800 outline-none rounded-xl"
                  >
                    <option value="Earned Leave">Earned Leave (Annual)</option>
                    <option value="Casual Leave">Casual Leave (Short)</option>
                    <option value="Emergency Leave">Emergency Family Leave</option>
                    <option value="Medical Leave">Medical Recovery Leave</option>
                    <option value="Compassionate Leave">Compassionate Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Start Date:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full neu-inset px-3 py-2 font-mono text-slate-800 outline-none rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">End Date:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full neu-inset px-3 py-2 font-mono text-slate-800 outline-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Reason & Justification for Leave:
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details (e.g. family medical emergency, domestic affair)..."
                    className="w-full neu-inset p-3 text-slate-800 outline-none rounded-xl h-24 font-mono text-xs resize-none"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="neu-btn px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="neu-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Application</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
