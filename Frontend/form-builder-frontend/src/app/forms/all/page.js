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
  Sparkles,
  Code2,
  Check,
  PencilLine,
  LayoutDashboard,
} from "lucide-react";

export default function FormsListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedApiId, setCopiedApiId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:9090/api/forms", { credentials: "include" })
      .then((res) => res.json())
      .then((res) => {
        setForms(res.data || []);
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

  const copyApiEndpoint = (id) => {
    const apiUrl = `http://localhost:9090/api/forms/${id}`;
    navigator.clipboard.writeText(apiUrl);
    setCopiedApiId(id);
    setTimeout(() => setCopiedApiId(null), 2000);
  };

  const publishForm = async (id) => {
    try {
      const res = await fetch(`http://localhost:9090/api/forms/publish/${id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Failed to publish form");
      }

      setForms((prevForms) =>
        prevForms.map((f) =>
          f.id === id ? { ...f, status: "PUBLISHED" } : f
        )
      );
    } catch (err) {
      console.error("Publish error:", err);
      alert("Error publishing form ❌");
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="relative w-20 h-20 flex justify-center items-center">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <LayoutDashboard className="text-blue-500 absolute animate-pulse" size={24} />
        </div>
        <p className="text-slate-400 mt-8 font-black tracking-[0.2em] uppercase text-[10px]">
          Synchronizing Workspace
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 overflow-hidden relative selection:bg-blue-200 pb-20">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none -mr-40 -mt-40" />

      <div className="max-w-7xl mx-auto mt-20 px-8 relative z-10 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-blue-600 text-[10px] font-black uppercase tracking-[0.15em]">
              <Sparkles size={14} className="animate-pulse" /> My Workspace
            </div>
            <h1 className="text-6xl font-black text-slate-950 tracking-tighter leading-none">
              Form <span className="text-blue-600">Vault</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium max-w-lg leading-relaxed">
              Manage your dynamic architecture. Deploy, edit, and analyze your data streams from a single command center.
            </p>
          </div>

          <Link href="/">
            <button className="group flex items-center gap-3 bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-bold shadow-2xl hover:bg-blue-600 hover:shadow-blue-500/30 transition-all active:scale-95 duration-500">
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-500" />
              <span>New Project</span>
            </button>
          </Link>
        </div>

        {forms.length === 0 ? (
          <div className="text-center py-40 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-all">
              <FileText className="text-slate-300" size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">The vault is empty</h3>
            <p className="text-slate-400 font-medium">Create your first dynamic form to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {forms.filter((form) => form.formName).map((form) => (
              <div
                key={form.id}
                className="group bg-white border border-slate-200/80 rounded-[2.5rem] p-2 hover:border-blue-200 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col"
              >
                <div className="p-8 pb-4">
                  <div className="flex justify-between items-center mb-8">
                    <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        REF: {form.id.toString().padStart(4, "0")}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${form.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${form.status === "PUBLISHED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      {form.status || "DRAFT"}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-8 capitalize tracking-tight line-clamp-2 min-h-[4rem]">
                    {form.formName}
                  </h3>

                  {/* Quick Utility Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <button
                      onClick={() => form.status === "PUBLISHED" && copyToClipboard(form.id)}
                      title={form.status === "PUBLISHED" ? "Copy Share Link" : "Publish to enable sharing"}
                      className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${form.status !== "PUBLISHED"
                        ? "bg-slate-100/50 border-slate-100 text-slate-300 cursor-not-allowed"
                        : copiedId === form.id
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-white hover:border-blue-200 hover:text-blue-600"
                        }`}
                    >
                      {copiedId === form.id ? <Check size={18} /> : <Clipboard size={18} />}
                      <span className="text-[8px] font-black uppercase mt-2 tracking-tighter">Share</span>
                    </button>

                    <button
                      onClick={() => copyApiEndpoint(form.id)}
                      title="Copy API Endpoint"
                      className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all ${copiedApiId === form.id
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-200 hover:text-indigo-600"
                        }`}
                    >
                      {copiedApiId === form.id ? <Check size={18} /> : <Code2 size={18} />}
                      <span className="text-[8px] font-black uppercase mt-2 tracking-tighter">API</span>
                    </button>

                    {form.status === "PUBLISHED" ? (
                      <Link href={`/forms/data/${form.id}`}>
                        <div className="flex flex-col items-center justify-center py-4 rounded-2xl border bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all h-full">
                          <Table size={18} />
                          <span className="text-[8px] font-black uppercase mt-2 tracking-tighter">Data</span>
                        </div>
                      </Link>
                    ) : (
                      <div
                        title="Publish to view data"
                        className="flex flex-col items-center justify-center py-4 rounded-2xl border bg-slate-100/50 border-slate-100 text-slate-300 cursor-not-allowed h-full"
                      >
                        <Table size={18} />
                        <span className="text-[8px] font-black uppercase mt-2 tracking-tighter">Data</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Footer */}
                <div className="p-2 pt-0 mt-auto">
                  <div className="bg-slate-50 rounded-[2rem] p-2 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* EDIT BUTTON */}
                      <Link href={`/forms/edit/${form.id}`} className="w-full">
                        <div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm">
                          <PencilLine size={16} />
                          <span>EDIT</span>
                        </div>
                      </Link>

                      {/* PUBLISH BUTTON */}
                      <button
                        onClick={() => publishForm(form.id)}
                        disabled={form.status === "PUBLISHED"}
                        className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-sm ${form.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700 cursor-default border border-emerald-200"
                          : "bg-white border border-slate-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50"
                          }`}
                      >
                        <CheckCircle size={16} />
                        <span>{form.status === "PUBLISHED" ? "LIVE" : "PUBLISH"}</span>
                      </button>
                    </div>

                    {form.status === "PUBLISHED" ? (
                      <Link href={`/forms/${form.id}`}>
                        <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-950 text-white font-bold text-xs hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
                          <ExternalLink size={16} />
                          <span className="tracking-widest uppercase">Launch Form</span>
                        </div>
                      </Link>
                    ) : (
                      <div
                        title="Publish to launch form"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"
                      >
                        <ExternalLink size={16} />
                        <span className="tracking-widest uppercase">Launch Form</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}