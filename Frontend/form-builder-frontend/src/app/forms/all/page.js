"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Clipboard, 
  Table, 
  ExternalLink, 
  Plus, 
  FileText,
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function FormsListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:9090/api/forms")
      .then((res) => res.json())
      .then((data) => {
        setForms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching forms:", err);
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (id) => {
    const url = `${window.location.origin}/forms/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="relative w-16 h-16 flex justify-center items-center">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <Sparkles className="text-blue-500 absolute animate-pulse" size={20} />
        </div>
        <p className="text-slate-500 mt-6 font-bold tracking-widest uppercase text-xs">Loading Dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 overflow-hidden relative selection:bg-blue-200">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto my-16 px-8 relative z-10 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Dashboard View
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-3">Form Manager</h1>
            <p className="text-slate-500 text-lg max-w-xl">Monitor your generated forms, copy sharing links, and analyze collected data streams.</p>
          </div>
          <Link href="/">
            <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-95 duration-300">
              <Plus size={20} />
              Create Form
            </button>
          </Link>
        </div>

        <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent w-full mb-12" />

        {forms.length === 0 ? (
          <div className="text-center py-32 bg-white/50 rounded-[2.5rem] border border-slate-200 border-dashed backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm relative z-10">
              <FileText className="text-slate-400" size={40} />
            </div>
            <p className="text-3xl font-black text-slate-800 mb-3 relative z-10 tracking-tight">No projects yet</p>
            <p className="text-slate-500 max-w-sm mx-auto relative z-10">Your dynamic forms will appear here once built and published via the builder.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms
              .filter((form) => form.formName)
              .map((form) => (
                <div 
                  key={form.id} 
                  className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-blue-300 transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-1 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)]"
                >
                  {/* Glowing hover effect */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-100/50 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Card Icon & ID */}
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="p-4 bg-slate-50 text-slate-500 border border-slate-100 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300 shadow-inner">
                      <FileText size={28} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest shrink-0">
                      ID: {form.id.toString().padStart(4, '0')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black text-slate-900 mb-10 group-hover:text-blue-600 transition-colors capitalize tracking-tight line-clamp-2 relative z-10 min-h-[4rem]">
                    {form.formName}
                  </h3>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                    {/* Share/Copy Link */}
                    <button
                      onClick={() => copyToClipboard(form.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        copiedId === form.id 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" 
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
                      }`}
                    >
                      {copiedId === form.id ? <CheckCircle size={20} className="mb-2" /> : <Clipboard size={20} className="mb-2" />}
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        {copiedId === form.id ? "Copied" : "Copy"}
                      </span>
                    </button>

                    {/* View Data */}
                    <Link href={`/forms/data/${form.id}`} className="no-underline">
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 hover:shadow-sm transition-all duration-300 h-full">
                        <Table size={20} className="mb-2" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-center">Data</span>
                      </div>
                    </Link>

                    {/* Public Fill Form */}
                    <Link href={`/forms/${form.id}`} className="col-span-2 no-underline">
                      <div className="relative overflow-hidden group/btn flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold text-sm hover:border-blue-600 transition-all active:scale-[0.98] shadow-md">
                        <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]" />
                        <ExternalLink size={18} className="relative z-10" />
                        <span className="relative z-10 tracking-wide uppercase text-xs font-black">Open Form</span>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}