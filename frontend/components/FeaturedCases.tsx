import React from "react";
import Link from "next/link";
import { CaseNote } from "@/lib/types";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, TrendingDown, Eye } from "lucide-react";

interface FeaturedCasesProps {
  cases: CaseNote[];
}

export default function FeaturedCases({ cases }: FeaturedCasesProps) {
  if (!cases || cases.length === 0) return null;

  const getCaseIcon = (featuredType: string) => {
    if (featuredType.includes("Healthy")) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (featuredType.includes("Early-warning")) {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
    if (featuredType.includes("Recovery")) {
      return <TrendingDown className="w-4 h-4 text-blue-600" />;
    }
    return <Eye className="w-4 h-4 text-amber-600" />;
  };

  const getTagStyle = (featuredType: string) => {
    if (featuredType.includes("Healthy")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (featuredType.includes("Early-warning")) {
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    if (featuredType.includes("Recovery")) {
      return "bg-blue-50 text-blue-800 border-blue-200";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  return (
    <div className="neu-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Case Walkthroughs
          </h3>
        </div>
        <span className="text-xs text-slate-600">
          Curated case studies from cohort case notes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cases.map((c) => (
          <Link
            key={c.personnel_id}
            href={`/personnel/${c.personnel_id}`}
            className="group rounded-xl neu-card-flat p-3.5 hover:shadow-[-5px_-5px_15px_#ffffff,5px_5px_15px_rgba(163,177,198,0.6)] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {c.personnel_id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${getTagStyle(
                    c.demo_featured
                  )}`}
                >
                  {getCaseIcon(c.demo_featured)}
                  {c.demo_featured}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                {c.story_headline}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {c.story_narrative}
              </p>
            </div>

            <div className="pt-2.5 mt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:text-blue-800">
              <span>View Case Deep-Dive</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
