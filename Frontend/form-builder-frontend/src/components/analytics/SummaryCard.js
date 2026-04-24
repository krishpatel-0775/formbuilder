"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function SummaryCard({ title, value, icon: Icon, colorClass }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-xl group"
    >
      <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
    </motion.div>
  );
}
