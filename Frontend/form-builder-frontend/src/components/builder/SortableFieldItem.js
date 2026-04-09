import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronRight, Heading, Pilcrow, Minus, Sparkles } from "lucide-react";
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
    opacity: isDragging ? 0.3 : 1 
  };

  const badgeBase = "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border shadow-sm";

  // ── Page Break special render ──────────────────────────────────────────────
  if (field.type === "page_break") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-center group py-4">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 flex items-center gap-1.5 cursor-grab active:cursor-grabbing px-2 py-2 rounded-xl hover:bg-white hover:shadow-lg transition-all">
          <GripVertical size={16} className="text-slate-300 group-hover:text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-4 ml-10">
          <div className="flex-1 border-t-2 border-dashed border-primary/20" />
          <div className="flex items-center gap-3 px-6 py-2.5 bg-white border border-primary/10 rounded-2xl shadow-xl shadow-primary/5 flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black text-slate-600 tracking-[0.2em]">
              {field.label || `Page ${idx + 1}`}
            </span>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-primary/20" />
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-4 flex items-center justify-center w-10 h-10 rounded-2xl bg-white text-red-400 hover:text-red-500 hover:shadow-lg transition-all ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  // ── Heading static element ────────────────────────────────────────────────
  if (field.type === "heading") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-start group">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-white hover:shadow-lg transition-all mt-4">
          <GripVertical size={16} className="text-slate-300 group-hover:text-primary" />
        </div>
        <div className="flex-1 ml-10 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm group-hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-orange-400 rounded-full" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Form Field</p>
          </div>
          <input
            value={field.label}
            onChange={(e) => updateField(field.id, "label", e.target.value)}
            placeholder="Section Label..."
            className="w-full text-2xl font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200 tracking-tight"
          />
          <div className="flex gap-2 mt-4">
            <span className={`${badgeBase} bg-slate-50 border-slate-100 text-slate-400`}>Heading</span>
            {field._dbId ? (
                <span className={`${badgeBase} bg-primary/5 border-primary/10 text-primary`}>Persistent</span>
            ) : (
                <span className={`${badgeBase} bg-emerald-50 border-emerald-100 text-emerald-500`}>Draft</span>
            )}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-4 flex items-center justify-center w-11 h-11 rounded-2xl bg-white text-red-300 hover:text-red-500 hover:shadow-xl transition-all mt-4 ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  // ── Paragraph static element ──────────────────────────────────────────────
  if (field.type === "paragraph") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-start group">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-white hover:shadow-lg transition-all mt-4">
          <GripVertical size={16} className="text-slate-300 group-hover:text-primary" />
        </div>
        <div className="flex-1 ml-10 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm group-hover:shadow-xl transition-all">
          <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-blue-400 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Contextual Narrative</span>
          </div>
          <textarea
            rows={2}
            value={field.label}
            onChange={(e) => updateField(field.id, "label", e.target.value)}
            placeholder="Add descriptive layer here..."
            className="w-full text-base text-slate-500 font-medium bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-200"
          />
          <div className="flex gap-2 mt-4">
            <span className={`${badgeBase} bg-slate-50 border-slate-100 text-slate-400`}>Paragraph</span>
            {field._dbId ? (
                <span className={`${badgeBase} bg-primary/5 border-primary/10 text-primary`}>Persistent</span>
            ) : (
                <span className={`${badgeBase} bg-emerald-50 border-emerald-100 text-emerald-500`}>Draft</span>
            )}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-4 flex items-center justify-center w-11 h-11 rounded-2xl bg-white text-red-300 hover:text-red-500 hover:shadow-xl transition-all mt-4 ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  // ── Divider static element ────────────────────────────────────────────────
  if (field.type === "divider") {
    return (
      <div ref={setNodeRef} style={style} className="relative flex items-center group py-6">
        <div {...attributes} {...listeners}
          className="absolute left-0 z-10 cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-white hover:shadow-lg transition-all">
          <GripVertical size={16} className="text-slate-300 group-hover:text-primary" />
        </div>
        <div className="flex-1 ml-10 flex items-center gap-4 py-2">
          <div className="flex-1 border-t border-slate-100" />
          <div className="px-5 py-1.5 rounded-full bg-slate-50 border border-slate-100">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Phase Break</span>
          </div>
          <div className="flex-1 border-t border-slate-100" />
        </div>
        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
          className={`opacity-0 group-hover:opacity-100 ml-4 flex items-center justify-center w-10 h-10 rounded-xl bg-white text-red-200 hover:text-red-400 transition-all ${isDragging ? "hidden" : ""}`}>
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} onClick={() => setActiveFieldId(field.id)}
      className={`group relative flex items-center p-6 gap-6 bg-white rounded-[2rem] border transition-all duration-500 cursor-pointer ${
          isActive 
          ? "border-primary shadow-[0_20px_50px_rgba(59,130,246,0.1)] ring-1 ring-primary/20 -translate-y-0.5" 
          : "border-slate-100 hover:border-slate-200 hover:shadow-lg text-slate-800"
      }`}>
      <div {...attributes} {...listeners} className="flex flex-col items-center justify-center w-10 cursor-grab active:cursor-grabbing hover:bg-slate-50 p-2 rounded-xl transition-colors">
        <span className="text-[9px] font-black text-slate-300 mb-1.5 pointer-events-none tracking-tighter">{String(idx + 1).padStart(2, '0')}</span>
        <GripVertical size={18} className="text-slate-200 group-hover:text-primary transition-colors pointer-events-none" />
      </div>

      <div className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] border shadow-inner transition-all duration-500 ${
          isActive ? "bg-primary text-white border-primary shadow-primary/20" : "bg-slate-50 text-slate-400 border-slate-100"
      }`}>
          {FieldIcons[field.type]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Field Type: <span className="text-primary/60">{field.type}</span></span>
            {field.required && <div className="w-1 h-1 rounded-full bg-red-400" />}
        </div>
        <input 
            placeholder="Lable..." 
            value={field.label} 
            onChange={(e) => updateField(field.id, "label", e.target.value)}
            className="w-full text-lg font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200 tracking-tight"
            onClick={(e) => e.stopPropagation()} 
        />
        <div className="flex items-center gap-2 mt-3">
          {field.required && <span className={`${badgeBase} bg-red-50 border-red-100 text-red-500`}>Required</span>}
          {field._dbId ? (
            <span className={`${badgeBase} bg-primary/5 border-primary/10 text-primary`}>Persistent</span>
          ) : (
            <span className={`${badgeBase} bg-emerald-50 border-emerald-100 text-emerald-500`}>Architecture Draft</span>
          )}
          {field.defaultValue && (
            <span className={`${badgeBase} bg-amber-50 border-amber-100 text-amber-500`}>Pre-populated</span>
          )}
        </div>
      </div>
      
      <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
        className={`opacity-0 group-hover:opacity-100 flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-red-200 hover:text-red-500 hover:shadow-xl transition-all ${isDragging ? "hidden" : ""}`}>
        <Trash2 size={20} />
      </button>
    </div>
  );
}
