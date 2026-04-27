"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * @param {string} title - Card label
 * @param {string|number} value - Primary displayed metric
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} colorClass - Tailwind bg-* class for accent
 * @param {string} [subtitle] - Optional small annotation beneath the value (e.g. "+3 today")
 * @param {'up'|'down'|'neutral'} [trend] - Optional trend direction indicator
 */
export default function SummaryCard({ title, value, icon: Icon, colorClass, subtitle, trend }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-500' :
    trend === 'down' ? 'text-rose-500' :
    'text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-xl group"
    >
      <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        {subtitle && (
          <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
            {trend && <TrendIcon size={11} />}
            <span className="text-[10px] font-bold">{subtitle}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
