"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    FileText,
    Calendar,
    Clock,
    Trash2,
    LayoutGrid,
    List as ListIcon,
    ArrowUpRight,
    ExternalLink,
    Rocket,
    Copy,
    Check,
    GitBranch
} from "lucide-react";

export default function FormVaultPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
    const [searchQuery, setSearchQuery] = useState("");
    const [publishingState, setPublishingState] = useState({}); // { [id]: boolean }
    const [copiedId, setCopiedId] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const res = await fetch("http://localhost:9090/api/v1/forms", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setForms(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching forms:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure ? This action is irreversible.")) return;

        try {
            const res = await fetch(`http://localhost:9090/api/v1/forms/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setForms(prev => prev.filter(f => f.id !== id));
            }
        } catch (err) {
            console.error("Error deleting form:", err);
        }
    };

    const handlePublish = async (id) => {
        if (!window.confirm("Are you want to publish this form ?")) return;

        setPublishingState(prev => ({ ...prev, [id]: true }));
        try {
            const res = await fetch(`http://localhost:9090/api/v1/forms/publish/${id}`, {
                method: "POST",
                credentials: "include"
            });

            if (res.ok) {
                setForms(prev => prev.map(f => f.id === id ? { ...f, status: "PUBLISHED" } : f));
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`❌ ${err.message || "Cloud synchronization failed."}`);
            }
        } catch (err) {
            console.error("Error publishing form:", err);
            alert("❌ An unexpected error occurred during synchronization.");
        } finally {
            setPublishingState(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleCopyLink = (id) => {
        const url = `${window.location.protocol}//${window.location.host}/forms/${id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }).catch(err => {
            console.error("Failed to copy link:", err);
        });
    };

    const filteredForms = forms.filter(f =>
        f.formName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <FileText size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Form Vault</h1>
                    </div>
                    <p className="text-slate-500 font-medium tracking-tight">Manage and monitor all your active forms.</p>
                </div>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                >
                    <Plus size={20} strokeWidth={3} />
                    Create New Form
                </Link>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white/20 shadow-sm">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search your forms..."
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-3xl text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        suppressHydrationWarning={true}
                    />
                </div>

                <div className="flex items-center gap-2 p-1 bg-white border border-slate-100 rounded-2xl">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}
                        suppressHydrationWarning={true}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-3 rounded-xl transition-all ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50"}`}
                        suppressHydrationWarning={true}
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : filteredForms.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                        <FileText size={32} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">No forms found</h3>
                    <p className="text-slate-500 mt-2 font-medium">Try a different search or create your first form.</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredForms.map(form => (
                        <div key={form.id} className="relative group bg-white rounded-[2.5rem] p-4 border border-slate-100 hover:border-primary/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] transition-transform group-hover:scale-110 duration-700 pointer-events-none" />

                            <div className="relative p-6 space-y-6">
                                {/* Header: Icon & Status */}
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-inner">
                                        <FileText size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${form.status === "PUBLISHED"
                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                            : "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${form.status === "PUBLISHED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                        {form.status}
                                    </div>
                                </div>

                                {/* Title & Meta Info */}
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors cursor-default truncate">
                                        {form.formName}
                                    </h3>
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                    <Link
                                        href={`/forms/edit/${form.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 hover:shadow-primary/20 hover:-translate-y-0.5"
                                    >
                                        Edit form
                                    </Link>

                                    <div className="flex gap-2">
                                        {form.status !== "PUBLISHED" ? (
                                            <button
                                                onClick={() => handlePublish(form.id)}
                                                disabled={publishingState[form.id]}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all shadow-sm disabled:opacity-50"
                                                title="Synchronize Architecture"
                                                suppressHydrationWarning={true}
                                            >
                                                {publishingState[form.id] ? (
                                                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                ) : (
                                                    <Rocket size={18} strokeWidth={2.5} />
                                                )}
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopyLink(form.id)}
                                                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm ${copiedId === form.id ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary"
                                                        }`}
                                                    title="Copy Form Link"
                                                >
                                                    {copiedId === form.id ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                                                </button>
                                                <Link
                                                    href={`/forms/${form.id}`}
                                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                                                    title="Fill Form"
                                                >
                                                    <ExternalLink size={18} strokeWidth={2.5} />
                                                </Link>
                                                <Link
                                                    href={`/forms/data/${form.id}`}
                                                    className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-500 transition-all shadow-sm"
                                                    title="View Live Data"
                                                >
                                                    <ArrowUpRight size={18} strokeWidth={2.5} />
                                                </Link>
                                            </div>
                                        )}

                                        <Link
                                            href={`/forms/${form.id}/versions`}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all shadow-sm"
                                            title="Version History"
                                            suppressHydrationWarning={true}
                                        >
                                            <GitBranch size={18} strokeWidth={2.5} />
                                        </Link>

                                        <button
                                            onClick={() => handleDelete(form.id)}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                                            title="Purge Protocol"
                                            suppressHydrationWarning={true}
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Form Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Modified</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredForms.map(form => (
                                <tr key={form.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                                <FileText size={18} />
                                            </div>
                                            <span className="font-bold text-slate-900">{form.formName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${form.status === "PUBLISHED" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                                            }`}>
                                            {form.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-semibold text-slate-500">2 hours ago</td>
                                    <td className="px-8 py-5 text-right space-x-2">
                                        {form.status !== "PUBLISHED" && (
                                            <button
                                                onClick={() => handlePublish(form.id)}
                                                disabled={publishingState[form.id]}
                                                className="inline-flex p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                suppressHydrationWarning={true}
                                            >
                                                <Rocket size={18} />
                                            </button>
                                        )}
                                        {form.status === "PUBLISHED" && (
                                            <>
                                                <button
                                                    onClick={() => handleCopyLink(form.id)}
                                                    className={`inline-flex p-2 rounded-lg transition-all ${copiedId === form.id ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-primary hover:bg-primary/5"
                                                        }`}
                                                    title="Copy Form Link"
                                                >
                                                    {copiedId === form.id ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                                <Link href={`/forms/${form.id}`} className="inline-flex p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Fill Form">
                                                    <ExternalLink size={18} />
                                                </Link>
                                            </>
                                        )}
                                        <Link href={`/forms/edit/${form.id}`} className="inline-flex p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Edit Architecture">
                                            <FileText size={18} />
                                        </Link>
                                        {form.status === "PUBLISHED" && (
                                            <Link href={`/forms/data/${form.id}`} className="inline-flex p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="View Live Data">
                                                <ArrowUpRight size={18} />
                                            </Link>
                                        )}
                                        <Link href={`/forms/${form.id}/versions`} className="inline-flex p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" title="Version History">
                                            <GitBranch size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(form.id)}
                                            className="inline-flex p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            suppressHydrationWarning={true}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}