"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  User, 
  Database, 
  FileText, 
  X, 
  CheckCircle2, 
  Download,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { ENDPOINTS, API_BASE_URL } from "../../../../../config/apiConfig";
import apiClient from "../../../../../utils/apiClient";

/**
 * SubmissionDetailPage Component
 * 
 * Displays full details of a specific form submission, including 
 * all entry data and metadata (submitter, timestamp).
 */
export default function SubmissionDetailPage() {
  const { id, submissionId } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || !submissionId) return;

    const fetchDetail = async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.submissionDetail(id, submissionId));
        setSubmission(res.data.data);
      } catch (err) {
        if (!err.message?.includes("restore form first")) {
          console.error("Fetch error:", err);
        }
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, submissionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
        </div>
        <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving record...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            {error?.includes("restore form first") ? "Restore Required" : "Access Denied"}
          </h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            {error || "The requested submission record could not be found or you do not have permission to view it."}
          </p>
          <button 
            onClick={() => router.back()}
            className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Return to List
          </button>
        </div>
      </div>
    );
  }

  const date = new Date(submission.submittedAt);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-indigo-100 italic-none">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900 active:scale-90"
            title="Go back"
          >
            <X size={22} />
          </button>
          <div className="h-8 w-[1px] bg-slate-100 mx-1" />
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Database size={20} />
             </div>
             <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    FORMCRAFT <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-black tracking-widest leading-none">PRO</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Submission Details</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response ID:</span>
                <code className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{submissionId}</code>
             </div>
             <span className="bg-emerald-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100">
                <CheckCircle2 size={12} />
                SUBMITTED
             </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-16">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
          
          {/* Main Data Section */}
          <div className="flex-1">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between leading-none">
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Entry Data</h2>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {Object.keys(submission.data).length} Fields Total
                    </span>
                </div>

                <div className="p-10 space-y-1 transition-all">
                    {Object.entries(submission.data).map(([key, value]) => {
                        const isFile = submission.fieldTypes?.[key] === "file_upload";
                        
                        return (
                            <div key={key} className="group py-8 first:pt-0 last:pb-0">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-indigo-600 transition-colors">
                                    {submission.fieldLabels[key] || key.replace(/_/g, " ")}
                                </label>
                                <div className="text-xl font-medium text-slate-900 leading-relaxed break-words">
                                    {value === null || value === undefined || value === "" ? (
                                        <span className="text-slate-300 italic text-lg">No response provided</span>
                                    ) : isFile ? (
                                        <a 
                                            href={`${API_BASE_URL}/api/v1/files/view/${value}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-2xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-xs font-black uppercase tracking-widest shadow-sm group/file"
                                        >
                                            <Download size={16} className="group-hover/file:translate-y-0.5 transition-transform" />
                                            View Resource
                                        </a>
                                    ) : (
                                        <div className="p-1 -ml-1">
                                            {value.toString()}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 h-[1px] bg-slate-50 w-full group-last:hidden" />
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>

          {/* Sidebar / Metadata */}
          <div className="w-full lg:w-[380px] space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-10 leading-none">
                    <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                        <Database size={20} />
                    </div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Metadata</h2>
                </div>

                <div className="space-y-8">
                    {/* Submitted By */}
                    <div className="flex items-center gap-5 p-2 group">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-indigo-100/50 group-hover:shadow-lg duration-500">
                            <User size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Submitted By</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{submission.submittedBy || "Anonymous"}</p>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-5 p-2 group">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-emerald-100/50 group-hover:shadow-lg duration-500">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Submission Date</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{formattedDate}</p>
                        </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-5 p-2 group">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-amber-100/50 group-hover:shadow-lg duration-500">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Precise Time</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{formattedTime}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Card */}
            <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200 p-10 text-white overflow-hidden relative group cursor-default">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-600/40 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                        <Download size={24} className="text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-3 tracking-tight">Export Record</h3>
                    <p className="text-sm font-medium text-slate-400 mb-10 leading-relaxed">
                        Download this individual response in PDF or High-Resolution CSV format.
                    </p>
                    <button className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 mt-auto">
                        Coming Soon
                    </button>
                </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
