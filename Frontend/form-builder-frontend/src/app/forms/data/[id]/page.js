"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, Database, Inbox, ExternalLink, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, FileSpreadsheet, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ENDPOINTS } from "../../../../config/apiConfig";

/**
 * FormDataPage Component
 * 
 * Displays submitted form data in a paginated, sortable table.
 */
export default function FormDataPage() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState("DRAFT");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination & Sorting State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [direction, setDirection] = useState("desc");
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Step 1: Check form status
      const formRes = await fetch(`${ENDPOINTS.FORMS}/${id}`, { credentials: "include" });
      if (!formRes.ok) throw new Error("Form not found or access denied.");
      const formJson = await formRes.json();
      const status = formJson.data?.status || "DRAFT";
      setFormStatus(status);

      if (status !== "PUBLISHED") {
        throw new Error("Form is either not published or access is restricted.");
      }

      const url = `${ENDPOINTS.FORMS}/${id}/data?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;

      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errText = errJson ? (errJson.message || JSON.stringify(errJson)) : await res.text();
        throw new Error(errText || `Server returned ${res.status}`);
      }

      const json = await res.json();
      const responseData = json.data || {};
      setData(responseData.content || []);
      setTotalPages(responseData.totalPages || 0);
      setTotalElements(responseData.totalElements || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, page, size, sortBy, direction]);

  const handleExport = async () => {
    if (!id || data.length === 0) return;
    setExporting(true);
    try {
      const url = `${ENDPOINTS.FORMS}/${id}/data?page=0&size=${totalElements || 1000}&sortBy=${sortBy}&direction=${direction}`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      const allData = json.data?.content || [];

      if (allData.length === 0) {
        alert("No data available to export.");
        return;
      }

      const exportData = allData.map(({ is_deleted, ...rest }) => {
        const cleaned = { ...rest };
        if (cleaned.created_at) {
          cleaned.created_at = new Date(cleaned.created_at).toLocaleString();
        }
        return cleaned;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

      const max_width = exportData.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => (v ? v.toString().length : 0))), 10);
      worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: Math.min(max_width, 50) }));

      const filename = `form_resp_${id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setDirection("asc");
    }
    setPage(0);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(row => row.id));
    }
  };

  const toggleSelectRow = (rowId) => {
    setSelectedIds(prev =>
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  const deleteResponse = async (responseId) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      const res = await fetch(`${ENDPOINTS.SUBMISSIONS}/${id}/response/${responseId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchData();
      } else {
        const errorMsg = await res.text();
        alert(`Error: ${errorMsg || "Failed to delete response"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error connecting to server");
    }
  };

  const deleteBulkResponses = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected responses?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`${ENDPOINTS.SUBMISSIONS}/${id}/responses/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedIds),
        credentials: "include",
      });

      if (res.ok) {
        fetchData();
        setSelectedIds([]);
      } else {
        const errorMsg = await res.text();
        alert(`Error: ${errorMsg || "Failed to delete responses"}`);
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Error connecting to server");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Fetching responses...</p>
      </div>
    );
  }

  const headers = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'is_deleted') : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="text-indigo-600" size={20} />
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Submission Manager</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Form Responses</h1>
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={deleteBulkResponses}
                disabled={deleting}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95 shadow-sm"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 size={18} />
                )}
                Delete Selected ({selectedIds.length})
              </button>
            )}

            <Link
              href={`/forms/${id}`}
              className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
            >
              <ExternalLink size={18} />
              View Form
            </Link>

            <button
              onClick={handleExport}
              disabled={exporting || data.length === 0}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FileSpreadsheet size={18} className="text-emerald-600" />
              )}
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <AlertCircle className="text-red-500 shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-red-800 font-black uppercase text-[11px] tracking-widest mb-2">Submission Fetch Error</h3>
              <div className="bg-white/50 border border-red-100 rounded-xl p-3 mb-4">
                <code className="text-red-600 text-xs font-bold leading-relaxed whitespace-pre-wrap">{error}</code>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchData}
                  className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-100 flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Retry Fetch
                </button>
              </div>
            </div>
          </div>
        )}

        {data.length === 0 && !loading && !error ? (
          <div className="bg-white p-16 rounded-[2.5rem] shadow-sm border border-slate-200 text-center max-w-lg mx-auto mt-20">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Inbox className="text-slate-400" size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No responses yet</h2>
            <p className="text-slate-500 font-medium mb-8">Once users submit your form, their data will appear here in a structured format.</p>
            <Link
              href={`/forms/${id}`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <ExternalLink size={20} />
              Go to Form Page
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {selectedIds.length === data.length && data.length > 0 ? (
                            <CheckSquare size={20} className="text-indigo-600" />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>
                      </th>
                      {headers.map((header) => (
                        <th
                          key={header}
                          onClick={() => handleSort(header)}
                          className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            {header.replace(/_/g, " ")}
                            <ArrowUpDown size={14} className={`transition-opacity ${sortBy === header ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-30'}`} />
                          </div>
                        </th>
                      ))}
                      <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-50 ${loading ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity"}`}>
                    {data.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-indigo-50/20 transition-colors group ${selectedIds.includes(row.id) ? 'bg-indigo-50/40' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <button
                            onClick={() => toggleSelectRow(row.id)}
                            className="text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            {selectedIds.includes(row.id) ? (
                              <CheckSquare size={20} className="text-indigo-600" />
                            ) : (
                              <Square size={20} />
                            )}
                          </button>
                        </td>
                        {headers.map((header) => (
                          <td key={header} className="px-8 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">
                            {row[header] !== null && row[header] !== undefined ? (
                              <span className="text-slate-700">
                                {header === "created_at" && typeof row[header] === "string"
                                  ? new Date(row[header]).toLocaleString("en-US", {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })
                                  : row[header].toString()}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-xs">null</span>
                            )}
                          </td>
                        ))}
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => deleteResponse(row.id)}
                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Response"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-6">
                  <p className="text-sm font-bold text-slate-500">
                    Total <span className="text-slate-900">{totalElements}</span> results
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Rows:</span>
                    <select
                      value={size}
                      onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                      className="text-sm font-bold border border-slate-200 rounded-xl px-3 py-1.5 bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    >
                      {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {selectedIds.length > 0 && (
                    <p className="text-xs font-bold text-indigo-600">
                      {selectedIds.length} items selected
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0 || loading}
                    onClick={() => setPage(page - 1)}
                    className="p-2 text-slate-500 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-white transition-all enabled:active:scale-95 bg-slate-50"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center px-4">
                    <span className="text-sm font-black text-slate-900 tracking-tighter">
                      Page {page + 1} <span className="text-slate-300 mx-1">/</span> {totalPages || 1}
                    </span>
                  </div>

                  <button
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage(page + 1)}
                    className="p-2 text-slate-500 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-white transition-all enabled:active:scale-95 bg-slate-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}