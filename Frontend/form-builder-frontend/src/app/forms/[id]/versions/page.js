"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitBranch, CheckCircle2, Clock, Plus, Zap, ArrowLeft,
  Loader2, Shield, AlertTriangle, ChevronRight
} from "lucide-react";
import { ENDPOINTS } from "../../../../config/apiConfig";

export default function FormVersionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [versions, setVersions] = useState([]);
  const [formName, setFormName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [formRes, verRes] = await Promise.all([
        fetch(`${ENDPOINTS.FORMS}/${id}`, { credentials: "include" }),
        fetch(ENDPOINTS.formVersions(id), { credentials: "include" }),
      ]);
      if (!formRes.ok || !verRes.ok) {
        router.push("/forms/all");
        return;
      }
      
      const formJson = await formRes.json();
      setFormName(formJson.data?.formName || `Form #${id}`);

      const verJson = await verRes.json();
      setVersions((verJson.data || []).reverse()); // latest first
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const createVersion = async () => {
    if (!confirm("Create a new version by cloning the latest version?")) return;
    setCreating(true);
    try {
      const res = await fetch(ENDPOINTS.formVersions(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create version.");
      }
      const data = await res.json();
      const newVersionId = data.data?.id;
      await fetchData();
      // Navigate to edit the new draft version
      if (newVersionId) {
        router.push(`/forms/edit/${id}?versionId=${newVersionId}`);
      }
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const activateVersion = async (versionId, versionNumber) => {
    if (!confirm(
      `Activate Version ${versionNumber}?\n\nThis will:\n• Make this version the live version\n• Discard any in-progress drafts from the previous version\n• Make the previous active version read-only`
    )) return;

    setActivating(versionId);
    try {
      const res = await fetch(ENDPOINTS.activateVersion(id, versionId), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to activate version.");
      }
      await fetchData();
    } catch (e) {
      alert(`❌ ${e.message}`);
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50/30">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Loading Versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/forms/all"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-bold mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> All Forms
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <GitBranch size={20} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-violet-500 uppercase tracking-widest">Version History</p>
                  <h1 className="text-2xl font-black text-slate-900">{formName}</h1>
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">
                Each version is an immutable snapshot. Activate a version to make it live.
              </p>
            </div>
            <button
              onClick={createVersion}
              disabled={creating}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 active:scale-95 disabled:opacity-60 whitespace-nowrap"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              New Version
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center gap-3 text-red-700">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Immutability Notice */}
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 mb-6 flex items-start gap-3 text-amber-800">
          <Shield size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-black text-xs uppercase tracking-widest mb-0.5">Versioning Rules</p>
            <p className="text-sm font-medium opacity-80">
              Active versions are read-only. Only draft (non-active) versions can be edited.
              New submissions always use the currently active version.
            </p>
          </div>
        </div>

        {/* Version List */}
        {versions.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center">
            <GitBranch size={40} className="text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-700 mb-2">No Versions Yet</h2>
            <p className="text-slate-400 text-sm font-medium mb-6">
              Click "New Version" to create the first version of this form.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => {
              const isActive = version.isActive;
              const isBeingActivated = activating === version.id;
              return (
                <div
                  key={version.id}
                  className={`bg-white rounded-[1.5rem] border-2 p-6 transition-all ${
                    isActive
                      ? "border-emerald-300 shadow-lg shadow-emerald-100"
                      : "border-slate-100 hover:border-violet-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Version icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        v{version.versionNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-slate-900">Version {version.versionNumber}</span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          )}
                          {!isActive && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                              <Clock size={10} /> Draft
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs font-medium">
                          Created {version.createdAt ? new Date(version.createdAt).toLocaleString() : "—"}
                          {version.createdBy && ` · by ${version.createdBy}`}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Edit — only allowed for draft versions */}
                      {!isActive && (
                        <Link
                          href={`/forms/edit/${id}?versionId=${version.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl text-xs font-black hover:bg-violet-100 transition-all"
                        >
                          Edit <ChevronRight size={14} />
                        </Link>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl text-xs font-black cursor-not-allowed">
                          Read-only
                        </span>
                      )}
                      {/* Activate — only for non-active versions */}
                      {!isActive && (
                        <button
                          onClick={() => activateVersion(version.id, version.versionNumber)}
                          disabled={isBeingActivated}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-60"
                        >
                          {isBeingActivated
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Zap size={12} />}
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
