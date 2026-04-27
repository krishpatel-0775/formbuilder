"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  Calendar,
  Loader2,
  TrendingUp,
  Download,
  AlertCircle,
  Send,
  ChevronDown,
  CheckCircle2,
  Activity,
  Zap,
  Star,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ENDPOINTS } from "@/config/apiConfig";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import SummaryCard from "@/components/analytics/SummaryCard";
import FieldChart from "@/components/analytics/FieldChart";

// ── Day-of-week bar colors (gradient from low → high)
const DOW_COLORS = ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];

// ── Custom tooltip for the trend chart
const TrendTooltip = ({ active, payload, label, peakDay }) => {
  if (!active || !payload?.length) return null;
  const isPeak = payload[0]?.payload?.rawDate === peakDay;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 min-w-[130px]">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-indigo-600">{payload[0]?.value}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase">submissions</p>
      {isPeak && (
        <div className="mt-2 flex items-center gap-1 text-amber-500">
          <Star size={10} fill="currentColor" />
          <span className="text-[9px] font-black uppercase tracking-widest">Peak Day</span>
        </div>
      )}
    </div>
  );
};

// ── Custom tooltip for the day-of-week chart
const DowTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-indigo-600">{payload[0]?.value}</p>
      <p className="text-[9px] font-bold text-slate-400">submissions</p>
    </div>
  );
};

export default function FormAnalyticsPage() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (!hasPermission(pathname)) router.push("/dashboard");
    }
  }, [user, authLoading, router, pathname, hasPermission]);

  const fetchAnalytics = useCallback(async (versionId = null, isVersionSwitch = false) => {
    if (!id || !user) return;
    if (isVersionSwitch) setVersionLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const [analyticsRes, formRes] = await Promise.all([
        apiClient.get(ENDPOINTS.formAnalytics(id), { params: versionId ? { versionId } : {} }),
        apiClient.get(`${ENDPOINTS.FORMS}/${id}`),
      ]);
      if (analyticsRes.data.success && formRes.data.success) {
        setAnalytics(analyticsRes.data.data);
        setForm(formRes.data.data);
        if (!isVersionSwitch) {
          setSelectedVersion(analyticsRes.data.data.selectedVersionId);
        }
      } else {
        setError("Failed to load analytics data.");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
      setVersionLoading(false);
    }
  }, [id, user]);

  // initial load
  useEffect(() => {
    if (id && user) fetchAnalytics(null, false);
  }, [id, user]);

  // version switch
  const handleVersionChange = (vId) => {
    setSelectedVersion(vId);
    fetchAnalytics(vId, true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-black tracking-widest uppercase text-[10px] animate-pulse">
          Analyzing form data…
        </p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
        <div className="bg-rose-50 p-8 rounded-full mb-6">
          <AlertCircle className="w-16 h-16 text-rose-500" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          Oops! Something went wrong
        </h2>
        <p className="text-slate-500 font-medium max-w-md mb-10">
          {error || "We couldn't load the analytics for this form."}
        </p>
        <Link
          href={`/forms/detail/${id}`}
          className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
        >
          Return to Hub
        </Link>
      </div>
    );
  }

  // ── Derived data
  const peakDay = analytics.peakDay;

  // Add rawDate to each trend point for peak highlighting
  const trendData = (analytics.submissionTrend || []).map((p) => ({
    ...p,
    // backend now sends "MMM d" as display date, store it as rawDate for tooltip ref
    rawDate: p.rawDate ?? p.date,
  }));

  // Day-of-week: sort by count to derive color intensity
  const dowData = analytics.dayOfWeekTrend || [];
  const maxDow = Math.max(...dowData.map((d) => d.count), 1);

  // Sorted field analytics for the fill-rate leaderboards
  const sortedFields = [...(analytics.fieldAnalytics || [])].sort(
    (a, b) => (b.fillRate ?? 0) - (a.fillRate ?? 0)
  );
  const topFields = sortedFields.slice(0, 5);
  const bottomFields = [...sortedFields].reverse().slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-32 selection:bg-indigo-100">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[5%] w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-violet-50/30 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 space-y-14">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link
              href={`/forms/detail/${id}`}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] tracking-[0.2em] uppercase"
            >
              <ArrowLeft size={14} /> Back to Hub
            </Link>
            <div className="flex items-center gap-6">
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                <TrendingUp size={40} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                  Form <span className="text-indigo-600">Analytics</span>
                </h1>
                <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[11px]">
                  {form?.formName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-2 rounded-[24px] border border-white shadow-sm">
            {/* Version Dropdown */}
            <div className="relative group/select">
              <select
                value={selectedVersion || ""}
                onChange={(e) => handleVersionChange(e.target.value)}
                disabled={versionLoading}
                className="appearance-none bg-white px-6 py-4 pr-12 rounded-[16px] font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm border border-slate-100 outline-none hover:bg-slate-50 transition-all cursor-pointer min-w-[180px] disabled:opacity-60"
              >
                {analytics.availableVersions?.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} {v.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
              {versionLoading
                ? <RefreshCw size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin pointer-events-none" />
                : <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-indigo-600 transition-colors" />
              }
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-8 py-4 bg-white rounded-[16px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600 shadow-sm border border-slate-100"
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </header>

        {/* ── KPI Summary Row (6 cards) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <SummaryCard
            title="Submissions"
            value={analytics.submittedCount}
            icon={Send}
            colorClass="bg-indigo-600"
            subtitle={`${analytics.totalSubmissions} total sessions`}
          />
          <SummaryCard
            title="Total Views"
            value={analytics.totalViews}
            icon={Users}
            colorClass="bg-amber-500"
          />
          <SummaryCard
            title="Engagement"
            value={`${analytics.engagementRate?.toFixed(1)}%`}
            icon={TrendingUp}
            colorClass="bg-emerald-600"
            subtitle="views → submissions"
          />
          <SummaryCard
            title="Draft Entries"
            value={analytics.draftCount}
            icon={Clock}
            colorClass="bg-blue-600"
            subtitle="incomplete sessions"
          />
          <SummaryCard
            title="Completion"
            value={`${analytics.completionRate?.toFixed(1)}%`}
            icon={CheckCircle2}
            colorClass="bg-violet-600"
            subtitle="sessions completed"
            trend={analytics.completionRate >= 70 ? 'up' : analytics.completionRate >= 40 ? 'neutral' : 'down'}
          />
          <SummaryCard
            title="Avg / Day"
            value={analytics.avgSubmissionsPerDay}
            icon={Activity}
            colorClass="bg-rose-500"
            subtitle={analytics.peakCount > 0 ? `Peak: ${analytics.peakCount} on ${analytics.peakDay}` : 'No submissions yet'}
          />
        </section>

        {/* ── Submission Trend ── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-2xl shadow-indigo-500/5 overflow-hidden relative"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                Submission <span className="text-indigo-600">Trend</span>
              </h2>
              <p className="text-sm text-slate-400 font-medium mt-1">
                Daily submissions over the last 30 days
                {analytics.peakDay && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                    <Star size={8} fill="currentColor" /> Peak: {analytics.peakDay}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Live
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={12} interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip peakDay={peakDay} />} />
                <Area
                  type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3}
                  fillOpacity={1} fill="url(#colorTrend)" dot={false}
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* ── Day-of-Week Heatmap ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-xl shadow-indigo-500/5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                Peak <span className="text-indigo-600">Days</span>
              </h2>
              <p className="text-sm text-slate-400 font-medium mt-1">
                Which day of the week gets the most submissions
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-4 h-2 rounded-full bg-indigo-200" /> Low
              <div className="w-4 h-2 rounded-full bg-indigo-600 ml-2" /> High
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  allowDecimals={false}
                />
                <Tooltip content={<DowTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36}>
                  {dowData.map((entry, index) => {
                    const intensity = maxDow > 0 ? entry.count / maxDow : 0;
                    const colorIdx = Math.floor(intensity * (DOW_COLORS.length - 1));
                    return <Cell key={index} fill={DOW_COLORS[colorIdx]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* ── Fill Rate Leaderboard ── */}
        {sortedFields.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Top fields */}
            <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-xl shadow-emerald-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <Star size={20} className="text-emerald-500" fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Top Filled Fields</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Highest response rates</p>
                </div>
              </div>
              <div className="space-y-4">
                {topFields.map((f, i) => (
                  <FillRateRow key={f.fieldName} rank={i + 1} label={f.fieldLabel} rate={f.fillRate} type={f.fieldType} isTop />
                ))}
              </div>
            </div>

            {/* Bottom fields */}
            <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-xl shadow-rose-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <AlertTriangle size={20} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Needs Attention</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lowest response rates</p>
                </div>
              </div>
              <div className="space-y-4">
                {bottomFields.map((f, i) => (
                  <FillRateRow key={f.fieldName} rank={i + 1} label={f.fieldLabel} rate={f.fillRate} type={f.fieldType} />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Field Insights ── */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                Field <span className="text-indigo-600">Insights</span>
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
                Deep dive into individual question responses
              </p>
            </div>
            <div className="h-px flex-1 bg-slate-100 hidden md:block mx-8 mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mb-3">
              {analytics.fieldAnalytics?.length ?? 0} fields
            </p>
          </div>

          {analytics.fieldAnalytics?.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[40px]">
              <BarChart3 size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No field data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {analytics.fieldAnalytics?.map((field, idx) => (
                  <motion.div
                    key={field.fieldName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.07 }}
                  >
                    <FieldChart
                      fieldLabel={field.fieldLabel}
                      fieldType={field.fieldType}
                      fieldName={field.fieldName}
                      stats={field.stats}
                      fillRate={field.fillRate}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/** Single row in the fill-rate leaderboard */
function FillRateRow({ rank, label, rate, type, isTop }) {
  const pct = Math.min(100, Math.max(0, rate ?? 0));
  const barColor = isTop
    ? pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-400'
    : pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-500';
  const textColor = isTop
    ? pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-500'
    : pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-600';

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-slate-300 w-4 shrink-0">#{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-slate-700 truncate pr-2">{label}</span>
          <span className={`text-[10px] font-black shrink-0 ${textColor}`}>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-[8px] font-bold text-slate-300 uppercase shrink-0 w-12 text-right">{type}</span>
    </div>
  );
}
