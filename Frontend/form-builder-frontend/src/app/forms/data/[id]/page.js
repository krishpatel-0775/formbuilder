"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, Database, Inbox, ExternalLink, Trash2 } from "lucide-react"; 
import Link from "next/link";

export default function FormDataPage() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:9090/api/forms/data/${id}`)
      .then((res) => res.json())
      .then((res) => {
        // ✅ Initial filter: Only show responses that aren't marked as deleted
        const rawData = res.data || [];
        const activeResponses = rawData.filter(item => item.is_deleted === false || item.is_deleted === undefined);
        setData(activeResponses);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const deleteResponse = async (responseId) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      const res = await fetch(`http://localhost:9090/api/submissions/${id}/response/${responseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // ✅ Update UI locally: remove the deleted item from state
        setData((prev) => prev.filter((item) => item.id !== responseId));
      } else {
        const errorMsg = await res.text();
        alert(`Error: ${errorMsg || "Failed to delete response"}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error connecting to server");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium tracking-wide">Fetching responses...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="text-slate-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No active responses</h2>
          <p className="text-slate-500 text-sm mb-6">Once users submit your form, their data will appear here.</p>
          <Link 
            href={`/forms/${id}`}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all"
          >
            <ExternalLink size={18} />
            Go to Form Page
          </Link>
        </div>
      </div>
    );
  }

  // Define headers but exclude internal fields from showing in the table UI if you wish
  // Here we include everything except internal metadata like is_deleted
  const headers = Object.keys(data[0]).filter(key => key !== 'is_deleted');

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="text-indigo-600" size={20} />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Submission Manager</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Form Responses</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href={`/forms/${id}`}
              className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-100 transition-all active:scale-95"
            >
              <ExternalLink size={18} />
              View Public Form
            </Link>

            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <Download size={18} />
              Export Data
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {headers.map((header) => (
                    <th 
                      key={header} 
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header.replace(/_/g, " ")}
                    </th>
                  ))}
                  {/* Action Header */}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    {headers.map((header) => (
                      <td 
                        key={header} 
                        className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap"
                      >
                        {row[header] !== null ? (
                          <span className="font-medium text-slate-700">
                            {row[header].toString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-xs">null</span>
                        )}
                      </td>
                    ))}
                    {/* Delete Action Button */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteResponse(row.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Response"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500">
              Showing <span className="text-slate-900">{data.length}</span> active submissions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}