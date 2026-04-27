"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  LayoutDashboard, 
  Database, 
  History, 
  Copy, 
  Settings2,
  Lock,
  Loader2,
  Check,
  Rocket,
  RefreshCw,
  Calendar,
  Zap,
  Archive,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { ENDPOINTS, API_BASE_URL } from "../../../../config/apiConfig";
import apiClient from "../../../../utils/apiClient";
import Swal from "sweetalert2";

import { useAuth } from "../../../../context/AuthContext";

export default function FormDetailHub() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [form, setForm] = useState(null);
  const [stats, setStats] = useState({ total: 0, lastResponse: "N/A", rate: "---" });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!hasPermission(pathname)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router, pathname, hasPermission]);

  useEffect(() => {
    if (id && user) {
      fetchFormDetail();
    }
  }, [id, user]);

  useEffect(() => {
    if (form && form.status === "PUBLISHED") {
      fetchFormStats();
    }
  }, [form]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const fetchFormDetail = async () => {
    try {
      const res = await apiClient.get(`${ENDPOINTS.FORMS}/${id}`);
      if (res.data.success) {
        setForm(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching form detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormStats = async () => {
    try {
      // We fetch the first page of data to get the total count
      const res = await apiClient.get(`${ENDPOINTS.FORMS}/${id}/data`, { params: { size: 1 } });
      if (res.data.success) {
        const data = res.data.data;
        const total = data.totalElements || 0;
        let lastResponse = "N/A";
        
        if (data.content && data.content.length > 0) {
           lastResponse = "Recent"; // We can improve this with actual timestamp logic if needed
        }

        setStats({
          total: total,
          lastResponse: lastResponse,
          rate: total > 0 ? "84.2%" : "0%" // Dummy engagement rate
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.protocol}//${window.location.host}/forms/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePublish = async () => {
    const result = await Swal.fire({
      title: 'Publish Form?',
      text: "This will create the database structure and make the form live.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      confirmButtonText: 'Yes, Publish'
    });

    if (!result.isConfirmed) return;

    setIsPublishing(true);
    try {
      const res = await apiClient.post(`${ENDPOINTS.FORMS}/publish/${id}`);
      if (res.data.success) {
        setForm(prev => ({ ...prev, status: "PUBLISHED" }));
        Swal.fire("Published!", "Your form is now live.", "success");
      }
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    const result = await Swal.fire({
      title: 'Archive Form?',
      text: "This form will be moved to the archive. You can restore it later from the Vault.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      confirmButtonText: 'ARCHIVE FORM',
      customClass: { popup: 'rounded-[32px]' }
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiClient.delete(`${ENDPOINTS.FORMS}/${id}`);
      if (res.data.success) {
        Swal.fire({ title: "Archived!", text: "Form moved to archive.", icon: "success", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[32px]' } });
        router.push('/forms/all');
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!form) return <div className="p-10 text-center">Form not found.</div>;


  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-8 selection:bg-indigo-100">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -left-[5%] w-[400px] h-[400px] bg-blue-50/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        
        {/* 1. HEADER HUB */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <nav className="flex items-center gap-2 text-slate-400 font-medium text-sm tracking-wide uppercase">
              <Link href="/forms/all" className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
                 <ArrowLeft size={14} /> Vault
              </Link>
              <span className="opacity-30">/</span>
              <span className="text-indigo-600">{form.formName}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-[0.9] break-words max-w-4xl">
              {form.formName}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-2 rounded-[24px] border border-white shadow-sm">
            {form.status === "PUBLISHED" ? (
              <button className="px-6 py-3 rounded-[16px] bg-white shadow-sm border border-slate-100 font-bold text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                LIVE STATUS
              </button>
            ) : (
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-3 rounded-[16px] bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all"
              >
                {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : <Rocket size={16} />}
                PUBLISH FORM
              </button>
            )}
            <button className={`px-6 py-3 rounded-[16px] font-bold text-sm transition-colors ${form.status === "DRAFT" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              DRAFT MODE
            </button>
          </div>
        </header>

        {form.status === "DRAFT" ? (
          <div className="bg-white border border-slate-100 rounded-[48px] p-12 text-center shadow-2xl shadow-indigo-500/5 max-w-5xl mx-auto relative overflow-hidden group">
            {/* Background Decorative Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[100px] -ml-32 -mb-32" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-indigo-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-700">
                <Sparkles size={48} strokeWidth={2.5} className="animate-pulse" />
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6 leading-none">Preparation <span className="text-indigo-600">Phase</span></h2>
              <p className="text-lg text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed italic">
                "Great designs take time. Refine your form structure and logic to perfection before going live to the world."
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <Link href={`/forms/edit/${id}`} className="group/card">
                  <ActionCard 
                    icon={<LayoutDashboard size={32} />} 
                    title="Edit Form" 
                    desc="Visual drag-and-drop editor for complex fields." 
                    primary 
                  />
                </Link>
                <div onClick={handlePublish} className="cursor-pointer group/card">
                  <ActionCard 
                    icon={<Rocket size={32} />} 
                    title="Publish Form" 
                    desc="Generate database and activate public URL." 
                  />
                </div>
              </div>

              <div className="mt-12 flex items-center justify-center gap-8 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  Step 1: Design
                </div>
                <div className="w-12 h-px bg-slate-200" />
                <div className="flex items-center gap-2 opacity-40">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  Step 2: Publish
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-6">
              <div className="bg-white/40 backdrop-blur-md border border-white/80 p-8 rounded-[32px] shadow-sm max-w-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Submissions</p>
                <p className="text-3xl font-bold tracking-tight">{stats.total.toLocaleString()}</p>
                <p className="text-xs font-medium text-indigo-600 mt-1">+0% this month</p>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Link href={`/forms/edit/${id}`}>
                <ActionCard 
                  icon={<LayoutDashboard size={32} />} 
                  title="Edit Form" 
                  desc="Visual drag-and-drop editor for forms." 
                  primary 
                />
              </Link>
              <Link href={`/forms/analytics/${id}`}>
                <ActionCard 
                  icon={<BarChart3 size={32} />} 
                  title="Analytics" 
                  desc="Deep dive into submission trends & stats." 
                />
              </Link>
              <Link href={`/forms/data/${id}`}>
                <ActionCard 
                  icon={<Database size={32} />} 
                  title="Submission Vault" 
                  desc="Export, filter, and analyze entry data." 
                />
              </Link>
              <Link href={`/forms/${id}/versions`}>
                <ActionCard 
                  icon={<History size={32} />} 
                  title="Version History" 
                  desc="Restore previous form iterations." 
                />
              </Link>
            </section>
          </>
        )}

        {/* 4. SHARING & INTEGRATION PANEL */}
        {form.status === "PUBLISHED" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[48px] p-10 shadow-xl shadow-indigo-500/5">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Share & Integrate</h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Public Form URL</label>
                  <div className="flex items-center gap-4">
                    <input readOnly value={`${window.location.protocol}//${window.location.host}/forms/${id}`} className="bg-transparent font-medium w-full outline-none text-sm text-slate-600" />
                    <button 
                      onClick={handleCopyLink}
                      className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-indigo-600" />}
                    </button>
                    <Link href={`/forms/${id}`} target="_blank" className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <ExternalLink size={20} className="text-indigo-600" />
                    </Link>
                  </div>
                </div>

                <div className="border-b border-slate-100 pb-4">
                  <span className="text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 px-2 pb-4 inline-block">
                    API Integration
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Section 1: Schema API */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">1. Fetch Form Schema (GET)</label>
                    <div className="bg-slate-900 rounded-[20px] p-5 text-indigo-300 font-mono text-xs leading-relaxed overflow-hidden group relative border border-slate-800">
                      <pre className="whitespace-pre-wrap break-all pr-12">
                        <code>{`${API_BASE_URL}${ENDPOINTS.FORMS}/${id}`}</code>
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${API_BASE_URL}${ENDPOINTS.FORMS}/${id}`);
                          Swal.fire({ title: "Copied!", text: "Schema URL copied", icon: "success", timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-[32px]' } });
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-white"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Submission API */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">2. Submit Response (POST)</label>
                    <div className="bg-slate-900 rounded-[20px] p-5 text-indigo-300 font-mono text-xs leading-relaxed overflow-hidden group relative border border-slate-800">
                      <pre className="whitespace-pre-wrap break-all pr-12">
                        <code>{`${API_BASE_URL}${ENDPOINTS.SUBMISSIONS}`}</code>
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${API_BASE_URL}${ENDPOINTS.SUBMISSIONS}`);
                          Swal.fire({ title: "Copied!", text: "Submission URL copied", icon: "success", timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-[32px]' } });
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-white"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. SETTINGS PANEL */}
            <div className="lg:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-[48px] p-10">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Form Details</h3>
              <div className="space-y-6">
                <DetailRow label="Created On" value={new Date(form.createdAt).toLocaleDateString()} icon={<Calendar size={16} />} />
                <DetailRow label="Table Name" value={form.tableName || "Not Generated"} icon={<Zap size={16} />} />
                <DetailRow label="Current Version" value={form.activeVersionNumber ? `v${form.activeVersionNumber}` : "Draft"} icon={<History size={16} />} />
                
                <div className="pt-6 mt-6 border-t border-indigo-200/50">
                  <button className="flex items-center gap-3 text-sm font-bold text-indigo-600 hover:gap-4 transition-all">
                    <Settings2 size={18} />
                    ALL ADVANCED SETTINGS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ARCHIVE ZONE */}
        <section className="bg-indigo-50/50 border border-indigo-100 rounded-[48px] p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-indigo-900 font-black uppercase tracking-tight text-xl">Archive Zone</h3>
            <p className="text-indigo-700/60 font-medium">Move this form to the archive. It can be restored at any time.</p>
          </div>
          <button 
            onClick={handleArchive}
            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-[20px] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3"
          >
            <Archive size={20} />
            ARCHIVE FORM
          </button>
        </section>
      </div>
    </div>
  );
};

/* Sub-components for cleanliness */
const ActionCard = ({ icon, title, desc, primary = false }) => (
  <div className={`group cursor-pointer p-10 h-full rounded-[48px] border transition-all duration-500 ${
    primary 
    ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-200 hover:scale-[1.02]' 
    : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-200 shadow-sm hover:shadow-xl'
  }`}>
    <div className={`mb-6 p-4 rounded-[20px] w-fit ${primary ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600'}`}>
      {icon}
    </div>
    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{title}</h3>
    <p className={`text-sm leading-relaxed ${primary ? 'text-indigo-100' : 'text-slate-500 font-medium'}`}>{desc}</p>
  </div>
);

const DetailRow = ({ label, value, icon }) => (
  <div className="flex items-center justify-between group gap-4">
    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider shrink-0">
      {icon}
      {label}
    </div>
    <span className="font-bold text-slate-700 truncate break-all text-right" title={value}>{value}</span>
  </div>
);

const ToggleRow = ({ label, active = false }) => (
  <div className="flex items-center justify-between group">
    <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{label}</span>
    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
      <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-7' : 'translate-x-1'}`} />
    </div>
  </div>
);

