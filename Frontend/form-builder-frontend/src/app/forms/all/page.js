"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Clipboard, 
  Table, 
  ExternalLink, 
  Plus, 
  FileText,
  CheckCircle 
} from "lucide-react"; // npm install lucide-react

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
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-4 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-12 px-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Form Manager</h1>
          <p className="text-slate-500 mt-2 text-lg">Create, share, and analyze your data collection.</p>
        </div>
        <Link href="/builder">
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus size={20} />
            Create New Form
          </button>
        </Link>
      </div>

      <div className="h-px bg-slate-200 w-full mb-10" />

      {forms.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-xl font-bold text-slate-700">No forms yet</p>
          <p className="text-slate-500">Your dynamic forms will appear here once created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {forms
            .filter((form) => form.formName)
            .map((form) => (
              <div 
                key={form.id} 
                className="group bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col"
              >
                {/* Card Icon & ID */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">
                    ID: {form.id.toString().slice(-6)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-800 mb-6 group-hover:text-indigo-600 transition-colors capitalize">
                  {form.formName}
                </h3>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  {/* Share/Copy Link */}
                  <button
                    onClick={() => copyToClipboard(form.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      copiedId === form.id 
                      ? "bg-green-50 border-green-200 text-green-600" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {copiedId === form.id ? <CheckCircle size={18} /> : <Clipboard size={18} />}
                    <span className="text-[11px] font-bold mt-1 uppercase tracking-tighter">
                      {copiedId === form.id ? "Copied!" : "Copy Link"}
                    </span>
                  </button>

                  {/* View Data */}
                  <Link href={`/forms/data/${form.id}`} className="no-underline">
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all h-full">
                      <Table size={18} />
                      <span className="text-[11px] font-bold mt-1 uppercase tracking-tighter text-center">Responses</span>
                    </div>
                  </Link>

                  {/* Public Fill Form */}
                  <Link href={`/forms/${form.id}`} className="col-span-2 no-underline">
                    <div className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95">
                      <ExternalLink size={16} />
                      Fill Form
                    </div>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}