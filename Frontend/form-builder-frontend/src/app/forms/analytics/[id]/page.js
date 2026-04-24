"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ENDPOINTS } from "@/config/apiConfig";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import SummaryCard from "@/components/analytics/SummaryCard";
import FieldChart from "@/components/analytics/FieldChart";

export default function FormAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const router = useRouter();

  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && user) {
      fetchAnalytics(selectedVersion);
    }
  }, [id, user, selectedVersion]);

  const fetchAnalytics = async (versionId = null) => {
    if (!versionId && !analytics) setLoading(true); // Only show full loader on first load
    try {
      const [analyticsRes, formRes] = await Promise.all([
        apiClient.get(ENDPOINTS.formAnalytics(id), { params: { versionId } }),
        apiClient.get(`${ENDPOINTS.FORMS}/${id}`)
      ]);

      if (analyticsRes.data.success && formRes.data.success) {
        setAnalytics(analyticsRes.data.data);
        setForm(formRes.data.data);
        if (!selectedVersion) {
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
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px] animate-pulse">Analyzing form data...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
        <div className="bg-rose-50 p-8 rounded-full mb-6">
          <AlertCircle className="w-16 h-16 text-rose-500" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Oops! Something went wrong</h2>
        <p className="text-slate-500 font-medium max-w-md mb-10">{error || "We couldn't load the analytics for this form."}</p>
        <Link href={`/forms/detail/${id}`} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-32 selection:bg-indigo-100">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[5%] w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 space-y-12">
        {/* Header */}
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
                <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[11px]">{form?.formName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-2 rounded-[24px] border border-white shadow-sm">
             {/* Version Dropdown */}
             <div className="relative group/select">
                <select 
                  value={selectedVersion || ""} 
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="appearance-none bg-white px-6 py-4 pr-12 rounded-[16px] font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm border border-slate-100 outline-none hover:bg-slate-50 transition-all cursor-pointer min-w-[180px]"
                >
                  {analytics.availableVersions?.map(v => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} {v.isActive ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-indigo-600 transition-colors" />
             </div>

             <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-8 py-4 bg-white rounded-[16px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600 shadow-sm border border-slate-100"
             >
               <Download size={18} /> Export PDF
             </button>
          </div>
        </header>

        {/* Summary Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="Submissions" 
            value={analytics.submittedCount} 
            icon={Send} 
            colorClass="bg-indigo-600" 
          />
          <SummaryCard 
            title="Total Views" 
            value={analytics.totalViews} 
            icon={Users} 
            colorClass="bg-amber-600" 
          />
          <SummaryCard 
            title="Engagement Rate" 
            value={`${analytics.engagementRate.toFixed(1)}%`} 
            icon={TrendingUp} 
            colorClass="bg-emerald-600" 
          />
          <SummaryCard 
            title="Draft Entries" 
            value={analytics.draftCount} 
            icon={Clock} 
            colorClass="bg-blue-600" 
          />
        </section>

        {/* Trend Chart Area */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-2xl shadow-indigo-500/5 overflow-hidden relative group"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Submission <span className="text-indigo-600">Trend</span></h2>
              <p className="text-sm text-slate-400 font-medium">Activity over the last 30 days</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                 <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                 Live Updates
               </div>
            </div>
          </div>
          
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.submissionTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                  cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#4f46e5" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Field Level Analysis */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Field <span className="text-indigo-600">Insights</span></h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Deep dive into individual question responses</p>
            </div>
            <div className="h-px flex-1 bg-slate-100 hidden md:block mx-8 mb-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {analytics.fieldAnalytics.map((field, idx) => (
                <motion.div
                  key={field.fieldName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <FieldChart 
                    fieldLabel={field.fieldLabel}
                    fieldType={field.fieldType}
                    stats={field.stats}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
