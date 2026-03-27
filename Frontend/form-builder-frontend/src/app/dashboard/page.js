"use client";
 
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/apiConfig";
import { 
  FileText, 
  Send, 
  Clock, 
  PlusCircle, 
  List, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import NextLink from "next/link";
 
export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
 
    useEffect(() => {
        fetch(ENDPOINTS.DASHBOARD_STATS, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStats(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch dashboard stats", err);
                setLoading(false);
            });
    }, []);
 
    if (loading) {
        return (
            <div className="p-10 space-y-8 animate-pulse">
                <div className="h-12 w-48 bg-slate-200 rounded-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-[2.5rem]"></div>
                    ))}
                </div>
                <div className="h-96 bg-slate-50 rounded-[3rem]"></div>
            </div>
        );
    }
 
    return (
        <div className="p-8 lg:p-12 space-y-12 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                        <TrendingUp size={14} />
                        System Overview
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Hello, {user?.fullName?.split(' ')[0] || 'User'} <span className="text-primary">.</span>
                    </h1>
                </div>
 
                <div className="flex items-center gap-4">
                    <NextLink href="/" className="group flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-primary text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <PlusCircle size={18} />
                        Create New Form
                    </NextLink>
                    <NextLink href="/forms/all" className="flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-white border-2 border-slate-100 text-slate-900 font-extrabold text-sm uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all">
                        <List size={18} />
                        View Vault
                    </NextLink>
                </div>
            </div>
 
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Forms" 
                    value={stats?.totalForms} 
                    icon={<FileText className="text-blue-500" />} 
                    color="blue"
                />
                <StatCard 
                    label="Active Submissions" 
                    value={stats?.totalSubmissions} 
                    icon={<Send className="text-purple-500" />} 
                    color="purple"
                />
                <StatCard 
                    label="Published" 
                    value={stats?.publishedForms} 
                    icon={<CheckCircle2 className="text-emerald-500" />} 
                    color="emerald"
                />
                <StatCard 
                    label="In Draft" 
                    value={stats?.draftForms} 
                    icon={<AlertCircle className="text-orange-500" />} 
                    color="orange"
                />
            </div>
 
            {/* Main Content Areas */}
            <div className="w-full">
                {/* Recent Forms Table */}
                <div className="bg-white rounded-[3rem] p-8 lg:p-10 shadow-sm border border-slate-100/50 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
                            <p className="text-sm text-slate-400 font-medium">Monitoring your last 5 manual modifications</p>
                        </div>
                        <NextLink href="/forms/all" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            See all <ChevronRight size={16} />
                        </NextLink>
                    </div>
 
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50">
                                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Form Name</th>
                                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="pb-4 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats?.recentForms?.length > 0 ? (
                                    stats.recentForms.map(form => (
                                        <tr key={form.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{form.formName}</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <StatusBadge status={form.status} />
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {new Date(form.updatedAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        {new Date(form.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 grayscale opacity-30">
                                                <FileText size={48} />
                                                <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No forms found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
 
function StatCard({ label, value, icon, color }) {
    const colorMap = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        emerald: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600"
    };
 
    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <div className={`h-14 w-14 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <div className="text-3xl font-black text-slate-900 tabular-nums leading-none">
                    {value || 0}
                </div>
            </div>
        </div>
    );
}
 
function StatusBadge({ status }) {
    if (status === 'PUBLISHED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <CheckCircle2 size={12} strokeWidth={3} /> Published
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-100">
            <Clock size={12} strokeWidth={3} /> Draft
        </span>
    );
}
