import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronRight, Heading, Pilcrow, Minus } from "lucide-react";
import { FieldIcons } from "./FieldConstants";

export function SortableFieldItem({ 
  field, 
  idx, 
  isActive, 
  setActiveFieldId, 
  removeField, 
  updateField 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    zIndex: isDragging ? 50 : 1, 
    opacity: isDragging ? 0.4 : 1 
  };

  // ── Page Break special render ──────────────────────────────────────────────
  if (field.type === "page_break") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-center group">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 flex items-center gap-1.5 cursor-grab active:cursor-grabbing px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
        </div>
        <div className="flex-1 flex items-center gap-3 ml-8">
          <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full shadow-sm flex-shrink-0">
            <ChevronRight size={14} className="text-indigo-500" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
              {field.label || "Page Break"}
            </span>
            <ChevronRight size={14} className="text-indigo-500" />
          </div>
          <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0 ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // ── Heading static element ────────────────────────────────────────────────
  if (field.type === "heading") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-start group">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 transition-colors mt-3">
          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
        </div>
        <div className="flex-1 ml-8 px-6 py-4 bg-white rounded-2xl border border-amber-200 shadow-sm">
          <input
            value={field.label}
            onChange={(e) => updateField(field.id, "label", e.target.value)}
            placeholder="Section heading text..."
            className="w-full text-xl font-black text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1 block">Heading</span>
          {field._dbId && <span className="text-[10px] font-bold text-violet-400 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100 mt-1 inline-block">Existing</span>}
          {!field._dbId && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1 inline-block">New</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0 mt-3 ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // ── Paragraph static element ──────────────────────────────────────────────
  if (field.type === "paragraph") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-start group">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 transition-colors mt-3">
          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
        </div>
        <div className="flex-1 ml-8 px-6 py-4 bg-white rounded-2xl border border-sky-200 shadow-sm">
          <textarea
            rows={2}
            value={field.label}
            onChange={(e) => updateField(field.id, "label", e.target.value)}
            placeholder="Paragraph / description text..."
            className="w-full text-sm text-slate-600 bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-300"
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 mt-1 block">Paragraph</span>
          {field._dbId && <span className="text-[10px] font-bold text-violet-400 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100 mt-1 inline-block">Existing</span>}
          {!field._dbId && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1 inline-block">New</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0 mt-3 ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // ── Divider static element ────────────────────────────────────────────────
  if (field.type === "divider") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-center group">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 cursor-grab active:cursor-grabbing px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
          <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
        </div>
        <div className="flex-1 ml-8 flex items-center gap-3 py-3">
          <div className="flex-1 border-t border-slate-300" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0">― Divider ―</span>
          <div className="flex-1 border-t border-slate-300" />
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0 ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} onClick={() => setActiveFieldId(field.id)}
      className={`group relative flex items-center p-5 gap-5 bg-white rounded-[1.5rem] border shadow-sm transition-all duration-300 cursor-pointer ${isActive ? "border-violet-400 shadow-[0_8px_30px_rgba(139,92,246,0.12)] ring-1 ring-violet-400" : "border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-800"}`}>
      <div {...attributes} {...listeners} className="flex flex-col items-center justify-center w-8 cursor-grab active:cursor-grabbing hover:bg-slate-50 p-1 rounded-lg transition-colors">
        <span className="text-[10px] font-black text-slate-400 mb-1 pointer-events-none">{idx + 1}</span>
        <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors pointer-events-none" />
      </div>
      <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">{FieldIcons[field.type]}</div>
      <div className="flex-1">
        <input placeholder="Enter question title..." value={field.label} onChange={(e) => updateField(field.id, "label", e.target.value)}
          className="w-full text-base font-bold text-slate-900 bg-transparent outline-none placeholder:font-medium placeholder:text-slate-400"
          onClick={(e) => e.stopPropagation()} />
        <div className="flex items-center gap-2 mt-1">
          {field.required && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">* REQUIRED</span>}
          {field._dbId ? (
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Existing</span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">New</span>
          )}
          {field.defaultValue && (
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Default set</span>
          )}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
        className={`opacity-0 group-hover:opacity-100 flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 ${isDragging ? "hidden" : ""}`}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
