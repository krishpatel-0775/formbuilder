"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

export default function FormSubmissions() {
  const params = useParams();
  const id = params.id;

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:9090/api/forms/data/${id}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);

        if (resData.length > 0) {
          const generatedColumns = Object.keys(resData[0]).map((key) => ({
            accessorKey: key,
            // Replace underscores with spaces for a cleaner header
            header: key.replace(/_/g, " ").toUpperCase(),
            cell: (info) => {
              const value = info.getValue();
              return value === null || value === "" ? (
                <span className="text-slate-300">—</span>
              ) : (
                <span className="text-slate-600 font-medium">{value.toString()}</span>
              );
            },
          }));

          setColumns(generatedColumns);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching submissions:", err);
        setLoading(false);
      });
  }, [id]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-100">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Fetching responses...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-10">
        <div className="max-w-4xl mx-auto border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
          <p className="text-slate-400 text-lg font-medium">No submissions found yet.</p>
          <p className="text-slate-300 text-sm mt-1">Once users fill out your form, their data will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Form Submissions
            </h2>
            <p className="text-slate-500 mt-1">
              Review and manage the data collected from your form.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
               {data.length} Total Responses
             </span>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-slate-50/50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-slate-50">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-indigo-50/30 transition-colors duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer / Pagination Placeholder */}
          <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-end">
             <p className="text-xs text-slate-400 italic">Showing all synchronized entries</p>
          </div>
        </div>
      </div>
    </div>
  );
}