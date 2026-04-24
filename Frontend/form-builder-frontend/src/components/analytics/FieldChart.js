"use client";

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function FieldChart({ fieldLabel, fieldType, stats }) {
  if (!stats) return null;

  const renderContent = () => {
    // 1. Choice distribution (Select, Radio, Checkbox)
    if (stats.distribution) {
      const data = Object.entries(stats.distribution).map(([name, value]) => ({ name, value }));
      
      if (data.length === 0) return <div className="text-gray-500 italic text-sm p-4">No data available</div>;

      return (
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} fontSize={11} stroke="#64748b" fontWeight="bold" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 2. Numeric Stats
    if (fieldType === 'number' && stats.avg !== undefined) {
      return (
        <div className="grid grid-cols-2 gap-3 p-2">
          <NumericBox label="Average" value={stats.avg.toFixed(1)} color="text-indigo-600" bg="bg-indigo-50" />
          <NumericBox label="Max" value={stats.max} color="text-emerald-600" bg="bg-emerald-50" />
          <NumericBox label="Min" value={stats.min} color="text-rose-600" bg="bg-rose-50" />
          <NumericBox label="Count" value={stats.count} color="text-blue-600" bg="bg-blue-50" />
        </div>
      );
    }

    // 3. Fallback for text or other types
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-4xl font-black text-slate-900 mb-1">{stats.responseCount || 0}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Responses</p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:border-indigo-100 transition-all duration-300 shadow-sm hover:shadow-xl">
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">{fieldLabel}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">{fieldType}</p>
        </div>
      </div>
      <div className="p-5">
        {renderContent()}
      </div>
    </div>
  );
}

const NumericBox = ({ label, value, color, bg }) => (
  <div className={`${bg} p-4 rounded-2xl border border-transparent hover:border-white/50 transition-all`}>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);
