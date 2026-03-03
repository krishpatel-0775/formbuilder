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
} from "lucide-react";

export default function FormsListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedApiId, setCopiedApiId] = useState(null); // Track API copy state

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

  // ✅ New Function to copy Backend API Endpoint
  const copyApiEndpoint = (id) => {
    const apiUrl = `http://localhost:9090/api/forms/${id}`;
    navigator.clipboard.writeText(apiUrl);
    setCopiedApiId(id);
    setTimeout(() => setCopiedApiId(null), 2000);
  };

  const publishForm = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:9090/api/forms/publish/${id}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to publish form");
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
        <div className="relative w-16 h-16 flex justify-center items-center">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <Sparkles
            className="text-blue-500 absolute animate-pulse"
            size={20}
          />
        </div>
        <p className="text-slate-500 mt-6 font-bold tracking-widest uppercase text-xs">
          Loading Dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 overflow-hidden relative selection:bg-blue-200">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto my-16 px-8 relative z-10 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Dashboard View
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-3">
              Form Manager
            </h1>
            <p className="text-slate-500 text-lg max-w-xl">
              Monitor your generated forms, copy sharing links, and analyze
              collected data streams.
            </p>
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
          <div className="text-center py-32 bg-white/50 rounded-[2.5rem] border border-slate-200 border-dashed backdrop-blur-sm">
            <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm">
              <FileText className="text-slate-400" size={40} />
            </div>
            <p className="text-3xl font-black text-slate-800 mb-3">
              No projects yet
            </p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Your dynamic forms will appear here once built and published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms
              .filter((form) => form.formName)
              .map((form) => (
                <div
                  key={form.id}
                  className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-blue-300 transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-1 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="p-4 bg-slate-50 text-slate-500 border border-slate-100 rounded-2xl">
                      <FileText size={28} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                      ID: {form.id.toString().padStart(4, "0")}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-10 capitalize tracking-tight min-h-[4rem]">
                    {form.formName}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    {/* Share Link Button */}
                    <button
                      onClick={() => copyToClipboard(form.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        copiedId === form.id
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600"
                      }`}
                    >
                      {copiedId === form.id ? (
                        <CheckCircle size={20} className="mb-2" />
                      ) : (
                        <Clipboard size={20} className="mb-2" />
                      )}
                      <span className="text-[10px] font-black tracking-widest uppercase text-center">
                        {copiedId === form.id ? "Link Copied" : "Share Link"}
                      </span>
                    </button>

                    {/* ✅ New API Endpoint Button */}
                    <button
                      onClick={() => copyApiEndpoint(form.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        copiedApiId === form.id
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600"
                      }`}
                    >
                      {copiedApiId === form.id ? (
                        <Check size={20} className="mb-2" />
                      ) : (
                        <Code2 size={20} className="mb-2" />
                      )}
                      <span className="text-[10px] font-black tracking-widest uppercase text-center">
                        {copiedApiId === form.id ? "API Copied" : "API Link"}
                      </span>
                    </button>

                    {/* View Data */}
                    <Link href={`/forms/data/${form.id}`}>
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all duration-300 h-full">
                        <Table size={20} className="mb-2" />
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          Data
                        </span>
                      </div>
                    </Link>

                    {/* Publish Button */}
                    <button
                      onClick={() => publishForm(form.id)}
                      disabled={form.status === "PUBLISHED"}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        form.status === "PUBLISHED"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default"
                          : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                      }`}
                    >
                      <CheckCircle size={20} className="mb-2" />
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        {form.status === "PUBLISHED" ? "Published" : "Publish"}
                      </span>
                    </button>

                    <Link href={`/forms/${form.id}`} className="col-span-2">
                      <div className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-blue-600 transition-all active:scale-[0.98]">
                        <ExternalLink size={18} />
                        <span className="tracking-wide uppercase text-xs font-black">
                          Open Form
                        </span>
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