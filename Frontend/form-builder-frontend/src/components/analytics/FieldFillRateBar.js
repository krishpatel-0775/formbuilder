"use client";

import React from 'react';

/**
 * A compact fill-rate progress bar used inside field analytics cards.
 * @param {number} rate - Fill rate as a percentage (0–100)
 */
export default function FieldFillRateBar({ rate = 0 }) {
  const pct = Math.min(100, Math.max(0, rate));

  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-amber-500' :
    'bg-rose-500';

  const textColor =
    pct >= 80 ? 'text-emerald-600' :
    pct >= 50 ? 'text-amber-600' :
    'text-rose-500';

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Fill Rate</span>
        <span className={`text-[10px] font-black ${textColor}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
