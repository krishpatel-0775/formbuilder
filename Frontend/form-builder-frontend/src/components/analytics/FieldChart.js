"use client";

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart2, PieChart as PieIcon, Hash, Calendar, Type, MessageSquare, Mail, Link } from 'lucide-react';
import FieldFillRateBar from './FieldFillRateBar';

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const TYPE_ICONS = {
  number: Hash,
  date: Calendar,
  datetime: Calendar,
  time: Calendar,
  text: Type,
  textarea: MessageSquare,
  email: Mail,
  url: Link,
};

/** Custom pie label renderer */
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 900 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/** Numeric stat box */
const NumericBox = ({ label, value, color, bg }) => (
  <div className={`${bg} p-4 rounded-2xl`}>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

/** Info chip */
const Chip = ({ label, value, colorClass = 'bg-slate-50 text-slate-500' }) => (
  <div className={`${colorClass} rounded-xl px-3 py-2 flex flex-col gap-0.5`}>
    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{label}</span>
    <span className="text-xs font-black truncate max-w-[120px]" title={value}>{value ?? '—'}</span>
  </div>
);

export default function FieldChart({ fieldLabel, fieldType, fieldName, stats, fillRate }) {
  const [chartMode, setChartMode] = useState('bar'); // 'bar' | 'pie'

  if (!stats) return null;

  const totalResponses = stats.totalResponses ?? stats.responseCount ?? 0;
  const FieldTypeIcon = TYPE_ICONS[fieldType] || Type;

  // ── EMPTY STATE
  if (totalResponses === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:border-slate-200 transition-all duration-300 shadow-sm">
        <CardHeader fieldLabel={fieldLabel} fieldType={fieldType} FieldTypeIcon={FieldTypeIcon} />
        <div className="p-5">
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-2xl font-black text-slate-300 mb-1">—</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No responses yet</p>
          </div>
          <FieldFillRateBar rate={fillRate ?? 0} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // ── CHOICE FIELDS (select, radio, checkbox)
    if (stats.distribution) {
      const data = Object.entries(stats.distribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      if (data.length === 0) {
        return (
          <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-400 italic">No responses recorded</p>
          </div>
        );
      }

      return (
        <div>
          {/* Chart type toggle */}
          <div className="flex gap-1 mb-4 bg-slate-50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setChartMode('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                chartMode === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart2 size={12} /> Bar
            </button>
            <button
              onClick={() => setChartMode('pie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                chartMode === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <PieIcon size={12} /> Pie
            </button>
          </div>

          {chartMode === 'bar' ? (
            <div style={{ height: Math.max(180, data.length * 38) }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name" type="category"
                    width={110} fontSize={11} stroke="#64748b" fontWeight="bold"
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px 14px' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: '900', fontSize: '11px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80}
                    labelLine={false} label={renderCustomLabel}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px' }}
                    itemStyle={{ fontWeight: '900', fontSize: '11px' }}
                  />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Most common badge */}
          {stats.mostCommon && (
            <div className="mt-3 flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Top pick:</span>
              <span className="text-xs font-black text-indigo-700">{stats.mostCommon}</span>
            </div>
          )}
        </div>
      );
    }

    // ── NUMBER FIELDS
    if (fieldType === 'number' && stats.avg !== undefined) {
      return (
        <div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NumericBox label="Average" value={stats.avg} color="text-indigo-600" bg="bg-indigo-50" />
            <NumericBox label="Median" value={stats.median ?? '—'} color="text-violet-600" bg="bg-violet-50" />
            <NumericBox label="Min" value={stats.min} color="text-rose-600" bg="bg-rose-50" />
            <NumericBox label="Max" value={stats.max} color="text-emerald-600" bg="bg-emerald-50" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumericBox label="Responses" value={stats.count ?? totalResponses} color="text-blue-600" bg="bg-blue-50" />
            <NumericBox label="Std Dev" value={stats.stdDev ?? '—'} color="text-amber-600" bg="bg-amber-50" />
          </div>
        </div>
      );
    }

    // ── DATE / DATETIME / TIME FIELDS
    if (fieldType === 'date' || fieldType === 'datetime' || fieldType === 'time') {
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Chip label="Earliest" value={stats.earliest} colorClass="bg-blue-50 text-blue-700" />
            <Chip label="Latest" value={stats.latest} colorClass="bg-indigo-50 text-indigo-700" />
          </div>
          {stats.mostCommonDate && (
            <Chip label="Most Common" value={stats.mostCommonDate} colorClass="bg-emerald-50 text-emerald-700" />
          )}
          {stats.uniqueCount !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unique values:</span>
              <span className="text-xs font-black text-slate-700">{stats.uniqueCount}</span>
            </div>
          )}
        </div>
      );
    }

    // ── TEXT / EMAIL / TEXTAREA / URL / TEL
    return (
      <div className="space-y-3">
        <div className="p-5 text-center bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-4xl font-black text-slate-900 mb-0.5">{totalResponses}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Responses</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.uniqueCount !== undefined && (
            <Chip label="Unique Values" value={stats.uniqueCount} colorClass="bg-violet-50 text-violet-700" />
          )}
          {stats.avgLength !== undefined && (
            <Chip label="Avg Length" value={`${stats.avgLength} chars`} colorClass="bg-blue-50 text-blue-700" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:border-indigo-100 transition-all duration-300 shadow-sm hover:shadow-xl group/card">
      <CardHeader fieldLabel={fieldLabel} fieldType={fieldType} FieldTypeIcon={FieldTypeIcon} totalResponses={totalResponses} />
      <div className="p-5">
        {renderContent()}
        <FieldFillRateBar rate={fillRate ?? stats.fillRate ?? 0} />
      </div>
    </div>
  );
}

/** Reusable card header shared across all field types */
function CardHeader({ fieldLabel, fieldType, FieldTypeIcon, totalResponses }) {
  return (
    <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-start gap-3">
      <div className="min-w-0">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight leading-tight truncate">{fieldLabel}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <FieldTypeIcon size={10} className="text-slate-400" />
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em]">{fieldType}</p>
        </div>
      </div>
      {totalResponses !== undefined && (
        <div className="bg-slate-50 rounded-xl px-2.5 py-1.5 shrink-0">
          <p className="text-[10px] font-black text-slate-500 tabular-nums">{totalResponses}</p>
        </div>
      )}
    </div>
  );
}
