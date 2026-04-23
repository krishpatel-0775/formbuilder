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
    GitBranch,
    History,
    RefreshCw,
    AlertCircle,
    Share2,
    Code,
    Globe,
    Send,
    X,
    Grid,
    Database,
    Settings2,
    ChevronRight,
    Layers,
    Sparkles
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ENDPOINTS, API_BASE_URL } from "../../../config/apiConfig";
import apiClient from "../../../utils/apiClient";
import Swal from "sweetalert2";

export default function FormVaultPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
    const [searchQuery, setSearchQuery] = useState("");
    const [publishingState, setPublishingState] = useState({}); // { [id]: boolean }
    const [copiedId, setCopiedId] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [deletedForms, setDeletedForms] = useState([]);
    const [fetchingDeleted, setFetchingDeleted] = useState(false);

    useEffect(() => {
        if (user) {
            setMounted(true);
            fetchForms();
        }
    }, [user]);

    if (authLoading || !user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }
    
    // API Links Modal State
    const [showApiModal, setShowApiModal] = useState(false);
    const [selectedFormForLinks, setSelectedFormForLinks] = useState(null);
    const [copiedLinkType, setCopiedLinkType] = useState(null); // 'metadata' | 'submission' | 'json'

    useEffect(() => {
        setMounted(true);
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const res = await apiClient.get(ENDPOINTS.FORMS);
            if (res.data.success) {
                setForms(res.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching forms:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeletedForms = async () => {
        setFetchingDeleted(true);
        try {
            const res = await apiClient.get(ENDPOINTS.DELETED_FORMS);
            if (res.data.success) {
                setDeletedForms(res.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching deleted forms:", err);
        } finally {
            setFetchingDeleted(false);
        }
    };

    const handleRestore = async (id) => {
        try {
            const res = await apiClient.put(ENDPOINTS.restoreForm(id));
            if (res.data.success) {
                setDeletedForms(prev => prev.filter(f => f.id !== id));
                fetchForms(); // Refresh the main list
                alert("✅ Form restored successfully!");
            } else {
                alert(`❌ ${res.data.message || "Failed to restore form."}`);
            }
        } catch (err) {
            console.error("Error restoring form:", err);
            alert(`❌ ${err.message || "An unexpected error occurred while restoring the form."}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This action is irreversible.")) return;

        try {
            const res = await apiClient.delete(`${ENDPOINTS.FORMS}/${id}`);
            if (res.data.success) {
                setForms(prev => prev.filter(f => f.id !== id));
            } else {
                alert(`❌ ${res.data.message || "Failed to delete form."}`);
            }
        } catch (err) {
            console.error("Error deleting form:", err);
            alert(`❌ ${err.message || "An unexpected error occurred while deleting the form."}`);
        }
    };

    const handlePublish = async (id) => {
        if (!window.confirm("Do you want to publish this form?")) return;

        setPublishingState(prev => ({ ...prev, [id]: true }));
        try {
            const res = await apiClient.post(`${ENDPOINTS.FORMS}/publish/${id}`);

            if (res.data.success) {
                setForms(prev => prev.map(f => f.id === id ? { ...f, status: "PUBLISHED" } : f));
            } else {
                alert(`❌ ${res.data.message || "Cloud synchronization failed."}`);
            }
        } catch (err) {
            console.error("Error publishing form:", err);
            alert(`❌ ${err.message || "An unexpected error occurred during synchronization."}`);
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

    const handleOpenApiModal = (form) => {
        setSelectedFormForLinks(form);
        setShowApiModal(true);
    };

    const handleCopyApiLink = (text, type) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedLinkType(type);
            setTimeout(() => setCopiedLinkType(null), 2000);
        }).catch(err => {
            console.error("Failed to copy API link:", err);
        });
    };


    const filteredForms = forms
        .filter(f => f.formName?.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Style object for CSS variables to avoid styled-jsx hydration issues
    const themeStyles = {
        "--primary": "#2463eb",
        "--primary-hover": "#1d4ed8",
        "--primary-soft": "rgba(36, 99, 235, 0.08)",
        "--primary-glow": "rgba(36, 99, 235, 0.25)",
    };

    return (
        <div 
            className="h-full flex flex-col overflow-hidden animate-in fade-in duration-700 bg-[#f9fafb]"
            style={themeStyles}
            suppressHydrationWarning={true}
        >
            {/* Fixed Top Section: Header & Controls */}
            <div className="p-6 lg:p-10 pb-4 space-y-8 flex-shrink-0" suppressHydrationWarning={true}>
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-[var(--primary-soft)] rounded-2xl text-[var(--primary)] shadow-sm border border-[#2463eb1a]">
                                <FileText size={26} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-4xl font-[900] text-slate-900 tracking-tight">Form Vault</h1>
                        </div>
                        <p className="text-slate-500 font-semibold tracking-tight ml-1 text-sm">Professional deployment and form management center.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setShowRestoreModal(true);
                                fetchDeletedForms();
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-lg transition-all w-full sm:w-auto"
                        >
                            <History size={16} strokeWidth={2.5} />
                            Recovery
                        </button>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-[var(--primary)] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[var(--primary-glow)] hover:bg-[var(--primary-hover)] hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
                        >
                            <Plus size={18} strokeWidth={3} />
                            Create New
                        </Link>
                    </div>
                </div>

                {/* Search & Layout Controls */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-2.5 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-all duration-300" size={20} />
                        <input
                            type="text"
                            placeholder="Find your forms..."
                            className="w-full pl-16 pr-6 py-4 bg-transparent rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-0 transition-all outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            suppressHydrationWarning={true}
                        />
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-3 rounded-xl transition-all duration-300 ${viewMode === "grid" ? "bg-white text-[var(--primary)] shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                            suppressHydrationWarning={true}
                        >
                            <LayoutGrid size={20} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-3 rounded-xl transition-all duration-300 ${viewMode === "list" ? "bg-white text-[var(--primary)] shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                            suppressHydrationWarning={true}
                        >
                            <ListIcon size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Section: Grid/List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar p-6 lg:p-10 pt-4 pb-24">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-white rounded-[3rem] border border-slate-100 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredForms.length === 0 ? (
                    <div className="h-[55vh] flex flex-col items-center justify-center bg-white/50 border-2 border-dashed border-slate-200 rounded-[4rem]">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                            <FileText size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Vault is Empty</h3>
                        <p className="text-slate-500 mt-2 font-semibold">Ready to start building something great?</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {filteredForms.map(form => (
                                <Link key={form.id} href={`/forms/detail/${form.id}`} className="group relative block">
                                    {/* Subtle Radial Glow */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] group-hover:bg-indigo-500/10 transition-all duration-700" />
                                    
                                    {/* Main Card Container */}
                                    <div className="relative flex flex-col justify-between h-64 p-10 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-700 cursor-pointer overflow-hidden group">
                                        
                                        <div className="relative">
                                            <div className="flex justify-between items-center mb-8">
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 ${
                                                    form.status === 'PUBLISHED' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${form.status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                        {form.status}
                                                    </span>
                                                </div>

                                                {form.activeVersionNumber != null && (
                                                    <div className="flex items-center gap-2 text-indigo-400 font-black text-[9px] uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Layers size={12} strokeWidth={3} />
                                                        v{form.activeVersionNumber}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 
                                                className="text-2xl md:text-3xl font-black text-slate-900 leading-[1.1] tracking-tighter group-hover:text-indigo-600 transition-all duration-500 line-clamp-2 break-words"
                                                title={form.formName}
                                            >
                                                {form.formName}
                                            </h3>
                                        </div>

                                        <div className="relative flex items-center justify-between pt-6 border-t border-slate-50">
                                            <div className="flex items-center gap-2.5 text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em]" suppressHydrationWarning={true}>
                                                <Calendar size={14} className="text-slate-300" />
                                                {mounted ? new Date(form.createdAt).toLocaleDateString() : "---"}
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                    Manage Hub
                                                </span>
                                                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 shadow-xl shadow-indigo-200 group-hover:rotate-[360deg]">
                                                    <ChevronRight size={18} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                        ))}
                    </div>
                ) : (
                    /* List View remains professional and clean */
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/40">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6 text-[11px] font-[900] text-slate-400 uppercase tracking-widest">Unit Name</th>
                                    <th className="px-10 py-6 text-[11px] font-[900] text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-10 py-6 text-[11px] font-[900] text-slate-400 uppercase tracking-widest">Modified</th>
                                    <th className="px-10 py-6 text-[11px] font-[900] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredForms.map(form => (
                                    <tr key={form.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#2463eb11] group-hover:text-[var(--primary)] flex items-center justify-center transition-all">
                                                    <FileText size={18} strokeWidth={2.5} />
                                                </div>
                                                <span className="font-bold text-slate-800 text-lg">{form.formName}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${form.status === "PUBLISHED" ? "bg-emerald-100/50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                                {form.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-sm font-bold text-slate-400" suppressHydrationWarning={true}>
                                            {mounted && form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "---"}
                                        </td>
                                        <td className="px-10 py-6 text-right space-x-2">
                                            {/* Primary Actions */}
                                            <Link href={`/forms/edit/${form.id}`} className="inline-flex p-3 text-slate-400 hover:text-[var(--primary)] transition-all rounded-xl hover:bg-[var(--primary-soft)]" title="Edit Form">
                                                <FileText size={20} />
                                            </Link>

                                            {form.status === "PUBLISHED" ? (
                                                <Link
                                                    href={`/forms/data/${form.id}`}
                                                    className="inline-flex p-3 text-slate-400 hover:text-emerald-600 transition-all rounded-xl hover:bg-emerald-50"
                                                    title="View Data"
                                                >
                                                    <ArrowUpRight size={20} />
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => handlePublish(form.id)}
                                                    disabled={publishingState[form.id]}
                                                    className="inline-flex p-3 text-slate-400 hover:text-[var(--primary)] transition-all rounded-xl hover:bg-[var(--primary-soft)] disabled:opacity-50"
                                                    title="Publish Form"
                                                >
                                                    {publishingState[form.id] ? (
                                                        <RefreshCw size={20} className="animate-spin" />
                                                    ) : (
                                                        <Rocket size={20} />
                                                    )}
                                                </button>
                                            )}

                                            {/* Utility Actions (Visible when Published) */}
                                            {form.status === "PUBLISHED" && (
                                                <>
                                                    <button
                                                        onClick={() => handleCopyLink(form.id)}
                                                        className={`inline-flex p-3 transition-all rounded-xl ${copiedId === form.id ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"}`}
                                                        title="Copy URL"
                                                    >
                                                        {copiedId === form.id ? <Check size={20} /> : <Copy size={20} />}
                                                    </button>
                                                    <Link
                                                        href={`/forms/${form.id}`}
                                                        className="inline-flex p-3 text-slate-400 hover:text-slate-900 transition-all rounded-xl hover:bg-slate-100"
                                                        title="Form Fill / Preview"
                                                    >
                                                        <ExternalLink size={20} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleOpenApiModal(form)}
                                                        className="inline-flex p-3 text-slate-400 hover:text-blue-600 transition-all rounded-xl hover:bg-blue-50"
                                                        title="API Copy"
                                                    >
                                                        <Code size={20} />
                                                    </button>
                                                </>
                                            )}

                                            {/* History & Delete */}
                                            <Link
                                                href={`/forms/${form.id}/versions`}
                                                className="inline-flex p-3 text-slate-400 hover:text-violet-600 transition-all rounded-xl hover:bg-violet-50"
                                                title="Form Versions"
                                            >
                                                <GitBranch size={20} />
                                            </Link>
                                            <button onClick={() => handleDelete(form.id)} className="inline-flex p-3 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50" title="Delete Form">
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Restore Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowRestoreModal(false)}
                    />
                    <div className="relative bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 border border-slate-100">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[var(--primary-soft)] rounded-2xl text-[var(--primary)] shadow-sm">
                                    <History size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Recovery Console</h2>
                                    <p className="text-sm text-slate-500 font-semibold mt-0.5">Bring decommissioned forms back online.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowRestoreModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-colors">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar no-scrollbar">
                            {fetchingDeleted ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-5">
                                    <div className="w-14 h-14 border-[5px] border-[var(--primary-soft)] border-t-[var(--primary)] rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Archive Vault...</p>
                                </div>
                            ) : deletedForms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner">
                                        <AlertCircle size={40} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 tracking-tight uppercase text-base">Archive Clean</p>
                                        <p className="text-sm text-slate-400 font-semibold mt-1">No forms found in recovery storage.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {deletedForms.map(form => (
                                        <div key={form.id} className="flex items-center justify-between p-7 bg-slate-50 border border-slate-200 rounded-[2rem] group hover:border-[var(--primary)] hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 gap-4">
                                            <div className="flex items-center gap-5 min-w-0 flex-1">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[var(--primary)] transition-colors shadow-inner shrink-0">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-[900] text-slate-900 text-lg tracking-tight truncate" title={form.formName}>{form.formName}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1" suppressHydrationWarning={true}>
                                                        Purged {mounted ? new Date(form.updatedAt).toLocaleDateString() : "---"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRestore(form.id)}
                                                className="flex items-center gap-3 px-7 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-[900] uppercase tracking-widest hover:bg-[var(--primary)] transition-all shadow-xl active:scale-95 shrink-0"
                                            >
                                                <RefreshCw size={16} strokeWidth={3} /> Restore
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-10 border-t border-slate-100 bg-slate-50/30 flex justify-end">
                            <button onClick={() => setShowRestoreModal(false)} className="px-10 py-4 bg-white border-2 border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-slate-300 transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Developer Blueprint Modal */}
            {showApiModal && selectedFormForLinks && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500"
                        onClick={() => setShowApiModal(false)}
                    />
                    <div className="relative bg-white rounded-[3.5rem] w-full max-w-3xl overflow-hidden shadow-[0_60px_120px_-20px_rgba(0,0,0,0.25)] animate-in zoom-in-95 duration-700 border border-slate-100">
                        {/* Modal Header */}
                        <div className="p-10 pb-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-2xl shadow-xl">
                                    <Code size={28} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[900] tracking-tight uppercase">API Gateway</h2>
                                    <p className="text-[11px] text-[var(--primary)] font-black tracking-[0.3em] uppercase opacity-90 mt-1">Version Control 2.4</p>
                                </div>
                            </div>
                            <button onClick={() => setShowApiModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-300">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar no-scrollbar">
                            
                            <div className="p-8 bg-[#2463eb07] border-2 border-[#2463eb11] rounded-[2.5rem] flex items-start gap-6 shadow-inner">
                                <div className="p-4 bg-white rounded-2xl text-[var(--primary)] shadow-lg shadow-[#2463eb11]">
                                    <Grid size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg tracking-tight">Sync Instructions</h4>
                                    <p className="text-sm text-slate-500 font-semibold leading-relaxed mt-1.5 italic">
                                        Use the available APIs to integrate dynamic <span className="text-[var(--primary)] font-bold">form creation and response handling</span> into your project.
                                    </p>
                                </div>
                            </div>

                            {/* Step 1 */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pl-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">01</div>
                                        <h4 className="font-black text-slate-800 text-base tracking-tight uppercase">Metadata Fetch</h4>
                                    </div>
                                    <span className="px-4 py-1.5 bg-[#2463eb11] text-[var(--primary)] text-[10px] font-black rounded-full uppercase tracking-widest border border-[#2463eb1a]">Schema Sync</span>
                                </div>
                                <div className="relative group">
                                    <div className="w-full pl-8 pr-24 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[12px] font-bold text-slate-600 font-mono break-all leading-loose shadow-inner">
                                        <span className="text-[var(--primary)] mr-3 font-[900]">GET</span> {`${API_BASE_URL}/forms/${selectedFormForLinks.id}`}
                                    </div>
                                    <button 
                                        onClick={() => handleCopyApiLink(`${API_BASE_URL}/forms/${selectedFormForLinks.id}`, 'metadata')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-white border border-slate-200 rounded-[1.25rem] text-slate-400 hover:text-[var(--primary)] hover:border-[#2463eb44] transition-all shadow-xl shadow-slate-200/20 active:scale-90"
                                    >
                                        {copiedLinkType === 'metadata' ? <Check size={20} className="text-emerald-500" strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 pl-2">
                                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">02</div>
                                    <h4 className="font-black text-slate-800 text-base tracking-tight uppercase">Payload Submission</h4>
                                </div>
                                <div className="relative group">
                                    <div className="w-full pl-8 pr-24 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-[12px] font-bold text-slate-600 font-mono break-all leading-loose shadow-inner">
                                        <span className="text-emerald-500 mr-3 font-[900]">POST</span> {`${API_BASE_URL}/submissions`}
                                    </div>
                                    <button 
                                        onClick={() => handleCopyApiLink(`${API_BASE_URL}/submissions`, 'submission')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-white border border-slate-200 rounded-[1.25rem] text-slate-400 hover:text-[var(--primary)] hover:border-[#2463eb44] transition-all shadow-xl shadow-slate-200/20 active:scale-90"
                                    >
                                        {copiedLinkType === 'submission' ? <Check size={20} className="text-emerald-500" strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                            <button onClick={() => setShowApiModal(false)} className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-[900] uppercase tracking-widest hover:bg-[var(--primary)] transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                                Close Documentation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}