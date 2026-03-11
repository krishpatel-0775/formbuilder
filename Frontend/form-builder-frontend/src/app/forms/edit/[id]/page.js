"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Type, Hash, Mail, Calendar, Trash2, GripVertical, X, AlertCircle, ShieldCheck,
  CheckCircle2, ListPlus, ArrowRight, AlignLeft, CircleDot, CheckSquare,
  Save, ArrowLeft, Loader2, Phone, Clock, Link, SlidersHorizontal, GitBranch, AlertTriangle, ChevronRight,
  Heading, Pilcrow, Minus, ToggleLeft
} from "lucide-react";
import NextLink from "next/link";
import RuleBuilder from "../../../../components/RuleBuilder";
import { ENDPOINTS } from "../../../../config/apiConfig";

// ─── Default Value Panel ───────────────────────────────────────────────────────
function DefaultValuePanel({ activeField, updateField }) {
  const textTypes = ["text", "email", "url", "phone", "number"];
  const base = "w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 shadow-sm";

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <SlidersHorizontal size={14} /> Default Value
      </label>

      {textTypes.includes(activeField.type) && (
        <input type={activeField.type === "number" ? "number" : "text"} placeholder="Pre-filled value..."
          value={activeField.defaultValue ?? ""} onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={base} />
      )}

      {activeField.type === "textarea" && (
        <textarea rows={3} placeholder="Pre-filled value..." value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={`${base} resize-none`} />
      )}

      {activeField.type === "date" && (
        <input type="date" value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)} className={base} />
      )}

      {activeField.type === "time" && (
        <input type="time" value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)} className={base} />
      )}

      {(activeField.type === "radio" || activeField.type === "select") &&
        !activeField.sourceTable && activeField.options?.length > 0 && (
          <select value={activeField.defaultValue ?? ""}
            onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)} className={base}>
            <option value="">None (no default)</option>
            {activeField.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        )}

      {activeField.type === "checkbox" && activeField.options?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 font-medium">Pre-check options:</p>
          {activeField.options.map((opt, i) => {
            const defaults = activeField.defaultValue ? activeField.defaultValue.split(",").map((v) => v.trim()) : [];
            const checked = defaults.includes(opt);
            return (
              <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"}`}>
                <input type="checkbox" checked={checked}
                  onChange={() => {
                    const current = activeField.defaultValue ? activeField.defaultValue.split(",").map((v) => v.trim()) : [];
                    const updated = checked ? current.filter((v) => v !== opt) : [...current, opt];
                    updateField(activeField.id, "defaultValue", updated.join(","));
                  }} className="w-4 h-4 rounded text-violet-600" />
                <span className="text-sm font-bold">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {activeField.type === "select" && activeField.sourceTable && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[11px] text-slate-400 font-medium">Default value not available for dynamic dropdowns.</p>
        </div>
      )}

      {activeField.defaultValue && (
        <button onClick={() => updateField(activeField.id, "defaultValue", "")}
          className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors">
          ✕ Clear default
        </button>
      )}
    </div>
  );
}

// ─── Display-only types helper ───────────────────────────────────────────────
const DISPLAY_ONLY_TYPES = new Set(["page_break", "heading", "paragraph", "divider"]);
const isDisplayOnly = (type) => DISPLAY_ONLY_TYPES.has(type);

// ─── Sortable Field Item ───────────────────────────────────────────────────────
function SortableFieldItem({ field, idx, isActive, setActiveFieldId, removeField, updateField, fieldIcons }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.4 : 1 };

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
      <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">{fieldIcons[field.type]}</div>
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

// ─── Main EditFormPage ─────────────────────────────────────────────────────────
export default function EditFormPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [activeSortId, setActiveSortId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formStatus, setFormStatus] = useState("DRAFT");
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedFormFields, setSelectedFormFields] = useState([]);
  const [rules, setRules] = useState([]);
  const [sidebarTab, setSidebarTab] = useState("properties"); // "properties" | "logic"

  const fieldIcons = {
    text: <Type size={18} />, textarea: <AlignLeft size={18} />, number: <Hash size={18} />,
    email: <Mail size={18} />, date: <Calendar size={18} />, phone: <Phone size={18} />,
    time: <Clock size={18} />, url: <Link size={18} />, radio: <CircleDot size={18} />,
    checkbox: <CheckSquare size={18} />, select: <ListPlus size={18} />,
    toggle: <ToggleLeft size={18} />,
    page_break: <ChevronRight size={18} />,
    heading: <Heading size={18} />,
    paragraph: <Pilcrow size={18} />,
    divider: <Minus size={18} />,
  };

  const staticElementTypes = [
    { type: "heading", label: "Heading", desc: "Section title", color: "amber", icon: <Heading size={16} /> },
    { type: "paragraph", label: "Paragraph", desc: "Description text", color: "sky", icon: <Pilcrow size={16} /> },
    { type: "divider", label: "Divider", desc: "Visual separator", color: "slate", icon: <Minus size={16} /> },
  ];

  const regularFieldTypes = ["text", "textarea", "number", "email", "date", "phone", "time", "url", "radio", "checkbox", "select", "toggle"];

  // Load form
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:9090/api/forms/${id}`, { credentials: "include" })
      .then((res) => { if (!res.ok) { alert("Failed to load form. Redirecting..."); router.push("/forms/all"); return null; } return res.json(); })
      .then((res) => {
        if (!res) return;
        const data = res.data;
        setFormName(data.formName || "");
        setFormStatus(data.status || "DRAFT");
        const noOpts = ["text", "textarea", "number", "email", "date", "phone", "time", "url", "page_break", "heading", "paragraph", "divider"];
        const staticFieldTypes = new Set(["heading", "paragraph", "divider"]);
        const loadedFields = (data.fields || []).map((f) => {
          const isStatic = staticFieldTypes.has(f.fieldType);
          // _orderKey is a stable unique ID used for field ordering in rules.
          // Static fields use their DB fieldName (e.g. "heading_0", "divider_2") as the key.
          // Regular fields use their column-name slug (same as the DB fieldName).
          const orderKey = f.fieldName || "";
          return {
            id: f.id * 1000 + Math.floor(Math.random() * 100),
            _dbId: f.id,
            _orderKey: orderKey,
            // For static fields: label holds the display text (stored in defaultValue in DB)
            label: isStatic ? (f.defaultValue || f.fieldName || "") : (f.fieldName || ""),
            type: f.fieldType || "text",
            required: f.required ?? false,
            defaultValue: isStatic ? "" : (f.defaultValue ?? ""),
            minLength: f.minLength ?? "", maxLength: f.maxLength ?? "",
            min: f.min ?? "", max: f.max ?? "",
            pattern: f.pattern ?? "",
            beforeDate: f.beforeDate ?? "", afterDate: f.afterDate ?? "",
            afterTime: f.afterTime ?? "", beforeTime: f.beforeTime ?? "",
            options: f.options?.length > 0 ? f.options : noOpts.includes(f.fieldType) ? [] : ["Option 1", "Option 2"],
            sourceTable: f.sourceTable ?? "", sourceColumn: f.sourceColumn ?? "",
          };
        });
        let rulesArr = [];
        try {
          if (data.rules) {
            rulesArr = typeof data.rules === "string" ? JSON.parse(data.rules) : data.rules;
            rulesArr = rulesArr || [];
            const orderRule = rulesArr.find(r => r.action?.targetField === "__FIELD_ORDER__");
            if (orderRule && orderRule.action?.message) {
              const orderArray = orderRule.action.message.split(",");
              // Sort using _orderKey (stable DB fieldName) not the display label
              loadedFields.sort((a, b) => {
                let aIdx = orderArray.indexOf(a._orderKey || "");
                let bIdx = orderArray.indexOf(b._orderKey || "");
                if (aIdx === -1) aIdx = 999;
                if (bIdx === -1) bIdx = 999;
                return aIdx - bIdx;
              });
            }
            rulesArr = rulesArr.filter(r => r.action?.targetField !== "__FIELD_ORDER__");
          }
        } catch (e) { console.warn("Could not parse rules", e); }

        setRules(rulesArr.map((r) => ({ ...r, _id: Date.now() + Math.random() })));
        setFields(loadedFields);
        setIsLoading(false);
      })
      .catch((err) => { console.error(err); alert("Failed to load form. Redirecting..."); router.push("/forms/all"); });
  }, [id]);

  useEffect(() => {
    const af = fields.find((f) => f.id === activeFieldId);
    if (af?.type === "select") {
      fetch("http://localhost:9090/api/forms", { credentials: "include" }).then(r => r.json()).then(r => setAvailableForms(r.data || [])).catch(console.error);
    }
  }, [activeFieldId, fields]);

  useEffect(() => {
    const af = fields.find((f) => f.id === activeFieldId);
    if (af?.type === "select" && af?.sourceTable) {
      fetch(`http://localhost:9090/api/forms/${af.sourceTable}`, { credentials: "include" }).then(r => r.json()).then(r => setSelectedFormFields(r.data?.fields || [])).catch(console.error);
    } else { setSelectedFormFields([]); }
  }, [activeFieldId, fields.find((f) => f.id === activeFieldId)?.sourceTable]);

  const activeField = useMemo(() => fields.find((f) => f.id === activeFieldId), [fields, activeFieldId]);
  const activeSortField = useMemo(() => fields.find((f) => f.id === activeSortId), [fields, activeSortId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e, type) => e.dataTransfer.setData("fieldType", type);

  const addStaticElement = (type) => {
    const defaultLabel = type === "heading" ? "New Section" : type === "paragraph" ? "Add description here..." : "";
    const newEl = {
      id: Date.now(), _dbId: null,
      label: type === "page_break" ? `Page ${fields.filter(f => f.type === "page_break").length + 2}` : defaultLabel,
      type, required: false, defaultValue: "", options: [],
    };
    setFields([...fields, newEl]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("fieldType");
    if (!type) return;

    if (isDisplayOnly(type)) {
      addStaticElement(type);
      return;
    }

    const newField = {
      id: Date.now(), _dbId: null, label: "", type: type.toLowerCase(), required: false, defaultValue: "",
      minLength: "", maxLength: "", min: "", max: "", pattern: "",
      beforeDate: "", afterDate: "", afterTime: "", beforeTime: "",
      options: ["radio", "checkbox", "select"].includes(type.toLowerCase()) ? ["Option 1", "Option 2"] : [],
      sourceTable: "", sourceColumn: "",
    };
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const addPageBreak = () => {
    const breakCount = fields.filter(f => f.type === "page_break").length + 1;
    const newBreak = {
      id: Date.now(), _dbId: null, label: `Page ${breakCount + 1}`, type: "page_break",
      required: false, defaultValue: "", options: [],
    };
    setFields([...fields, newBreak]);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleSortStart = (e) => setActiveSortId(e.active.id);
  const handleSortEnd = (e) => {
    const { active, over } = e;
    if (active.id !== over?.id) {
      setFields((items) => { const oi = items.findIndex((i) => i.id === active.id); const ni = items.findIndex((i) => i.id === over.id); return arrayMove(items, oi, ni); });
    }
    setActiveSortId(null);
  };
  const handleSortCancel = () => setActiveSortId(null);

  const updateField = (id, key, value) => {
    if (key === "label") {
      setFields((p) => {
        const field = p.find((f) => f.id === id);
        if (field && field.label !== value) {
          const oldCol = field.label ? field.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
          const newCol = value ? value.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
          if (oldCol && newCol && oldCol !== newCol) {
            setRules((prevRules) => prevRules.map((r) => {
              let newRule = { ...r };
              if (newRule.action?.targetField === oldCol) {
                newRule.action = { ...newRule.action, targetField: newCol };
              }
              if (newRule.condition?.conditions) {
                newRule.condition.conditions = newRule.condition.conditions.map((c) =>
                  c.field === oldCol ? { ...c, field: newCol } : c
                );
              }
              return newRule;
            }));
          }
        }
        return p.map((f) => (f.id === id ? { ...f, [key]: value } : f));
      });
    } else {
      setFields((p) => p.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
    }
  };
  const removeField = (id) => { setFields(fields.filter((f) => f.id !== id)); if (activeFieldId === id) setActiveFieldId(null); };
  const handleNumberInput = (e, id, key) => { const v = e.target.value; if (v === "" || /^\d+$/.test(v)) updateField(id, key, v); };
  const generateColumnName = (label) => label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const saveForm = async () => {
    if (!formName.trim()) return alert("Please name your form.");
    const realFields = fields.filter(f => !isDisplayOnly(f.type));
    if (realFields.length === 0) return alert("Add at least one input field.");
    setIsSaving(true);
    try {
      const formattedFields = fields.map((field, idx) => {
        // Display-only types (heading, paragraph, divider, page_break)
        if (isDisplayOnly(field.type)) {
          return {
            id: field._dbId ?? null,
            name: `${field.type}_${idx}`,
            type: field.type,
            // Store the admin-typed label text in defaultValue so public form can render it
            defaultValue: field.label || "",
          };
        }
        if (!field.label) throw new Error("All fields must have a label.");
        let fd = { id: field._dbId ?? null, name: generateColumnName(field.label), type: field.type, required: field.required };
        if (field.defaultValue) fd.defaultValue = field.defaultValue;
        if (field.type === "radio" || field.type === "checkbox") fd.options = field.options;
        if (field.type === "select") {
          if (field.sourceTable && field.sourceColumn) { fd.sourceTable = field.sourceTable; fd.sourceColumn = field.sourceColumn; fd.options = []; }
          else fd.options = field.options;
        }
        if (field.type === "text" || field.type === "textarea") {
          if (field.minLength) fd.minLength = Number(field.minLength);
          if (field.maxLength) fd.maxLength = Number(field.maxLength);
          if (field.type === "text" && field.pattern) fd.pattern = field.pattern;
        }
        if (field.type === "number") { if (field.min) fd.min = Number(field.min); if (field.max) fd.max = Number(field.max); }
        if (field.type === "email" && field.pattern) fd.pattern = field.pattern;
        if (field.type === "date") { if (field.afterDate) fd.afterDate = field.afterDate; if (field.beforeDate) fd.beforeDate = field.beforeDate; }
        if (field.type === "time") { if (field.afterTime) fd.afterTime = field.afterTime; if (field.beforeTime) fd.beforeTime = field.beforeTime; }
        if (field.type === "phone" && field.pattern) fd.pattern = field.pattern;
        return fd;
      });
      const res = await fetch(`http://localhost:9090/api/forms/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formName: formName.trim(), fields: formattedFields }),
        credentials: "include"
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed to update form."); }

      // Save rules separately
      try {
        const cleanRules = rules.map(rule => {
          const r = { ...rule };
          delete r._id;

          if (r.action) {
            if (!r.action.targetField) delete r.action.targetField;
            if (!r.action.message) delete r.action.message;
          }

          if (r.condition) {
            const processCondition = (cond) => {
              const cleaned = { ...cond };
              if (!cleaned.field) delete cleaned.field;
              if (!cleaned.operator) delete cleaned.operator;
              if (cleaned.value === undefined || cleaned.value === null || cleaned.value === "") delete cleaned.value;
              if (!cleaned.logicalOperator) delete cleaned.logicalOperator;

              if (cleaned.conditions && cleaned.conditions.length > 0) {
                cleaned.conditions = cleaned.conditions.map(processCondition);
              } else {
                delete cleaned.conditions;
              }
              return cleaned;
            };
            r.condition = processCondition(r.condition);
          }
          return r;
        });

        // Build the order list using CURRENT position for ALL static fields.
        // The backend ALWAYS stores static field name as "${type}_${idx}" (current array index) on every save,
        // so the order key must always reflect the current position — never the stale _orderKey.
        // Regular fields use column-name slug (unchanged by position).
        const currentOrderList = fields.map((f, idx) => {
          if (isDisplayOnly(f.type)) {
            // Always use current position key — matches what backend will store after this save
            return `${f.type}_${idx}`;
          }
          return f.label ? f.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
        }).filter(Boolean).join(",");
        cleanRules.push({
          action: { type: "SHOW", targetField: "__FIELD_ORDER__", message: currentOrderList }
        });

        await fetch(ENDPOINTS.formRules(id), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanRules),
          credentials: "include"
        });
      } catch (e) {
        console.warn("Failed to save rules:", e);
      }

      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); router.push("/forms/all"); }, 1500);
    } catch (err) { alert(`❌ ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const deleteForm = async () => {
    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone and will preserve the dynamic table data.")) {
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:9090/api/forms/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(errorMsg || "Failed to delete form.");
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/forms/all");
      }, 1000);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Form...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">

      {/* LEFT SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <ListPlus className="text-violet-600" size={20} />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Components</h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide">Drag & drop to add fields</p>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {/* ── Static Elements group ── */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Static Elements</p>
          {staticElementTypes.map(({ type, label, desc, icon }) => {
            const colorMap = {
              heading: { bg: "bg-amber-50", border: "border-amber-200", hbg: "hover:bg-amber-100", hborder: "hover:border-amber-300", ibg: "bg-amber-100", iborder: "border-amber-200", itext: "text-amber-500", text: "text-amber-700", htext: "hover:text-amber-900", desc: "text-amber-500" },
              paragraph: { bg: "bg-sky-50", border: "border-sky-200", hbg: "hover:bg-sky-100", hborder: "hover:border-sky-300", ibg: "bg-sky-100", iborder: "border-sky-200", itext: "text-sky-500", text: "text-sky-700", htext: "hover:text-sky-900", desc: "text-sky-500" },
              divider: { bg: "bg-slate-50", border: "border-slate-200", hbg: "hover:bg-slate-100", hborder: "hover:border-slate-300", ibg: "bg-slate-100", iborder: "border-slate-200", itext: "text-slate-400", text: "text-slate-600", htext: "hover:text-slate-900", desc: "text-slate-400" },
            };
            const c = colorMap[type];
            return (
              <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
                onClick={() => addStaticElement(type)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl border shadow-sm cursor-pointer transition-all group hover:-translate-y-0.5 ${c.bg} ${c.border} ${c.hbg} ${c.hborder}`}>
                <div className={`w-9 h-9 flex items-center justify-center rounded-xl ${c.ibg} border ${c.iborder} ${c.itext} flex-shrink-0`}>
                  {icon}
                </div>
                <div>
                  <span className={`text-sm font-bold ${c.text} ${c.htext}`}>{label}</span>
                  <p className={`text-[10px] ${c.desc} mt-0.5`}>{desc}</p>
                </div>
              </div>
            );
          })}

          {/* ── Page Break ── */}
          <div draggable onDragStart={(e) => handleDragStart(e, "page_break")}
            onClick={() => addStaticElement("page_break")}
            className="flex items-center gap-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group hover:-translate-y-0.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-500 flex-shrink-0">
              <ChevronRight size={16} />
            </div>
            <div>
              <span className="text-sm font-bold text-indigo-700 group-hover:text-indigo-900">Page Break</span>
              <p className="text-[10px] text-indigo-500 mt-0.5">Split form into pages</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Input Fields</p>
          </div>
          {regularFieldTypes.map((type) => (
            <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-grab hover:bg-slate-50 hover:border-violet-200 hover:shadow-md transition-all group hover:-translate-y-0.5">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-100 text-slate-400 transition-all duration-300">
                {fieldIcons[type]}
              </div>
              <div>
                <span className="text-sm font-bold capitalize text-slate-700 group-hover:text-slate-900 transition-colors">{type}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Custom input field</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Legend</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Existing</span>
            <span className="text-[11px] text-slate-500">Loaded from DB</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">New</span>
            <span className="text-[11px] text-slate-500">Will be added</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Default set</span>
            <span className="text-[11px] text-slate-500">Has default value</span>
          </div>
        </div>
      </aside>

      {/* CENTER CANVAS */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />
        <header className="h-20 border-b border-slate-200 px-8 flex items-center justify-between z-10 backdrop-blur-xl bg-white/80 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <NextLink href="/forms/all" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors flex-shrink-0">
              <ArrowLeft size={18} />
            </NextLink>
            <input type="text" placeholder="Form Title..." value={formName} onChange={(e) => setFormName(e.target.value)}
              className="text-2xl font-black bg-transparent border-none outline-none focus:ring-0 flex-1 max-w-lg placeholder:text-slate-400 text-slate-900 tracking-tight" />
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${formStatus === "PUBLISHED" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
              {formStatus}
            </span>
            <button onClick={deleteForm} disabled={isSaving || showSuccess}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-red-500 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-300 transition-all active:scale-95 shadow-sm">
              <Trash2 size={16} /> Delete
            </button>
            <button onClick={saveForm} disabled={isSaving || showSuccess}
              className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md ${showSuccess ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-900 text-white hover:bg-violet-600 hover:shadow-xl hover:shadow-violet-600/20"}`}>
              {showSuccess ? (<><CheckCircle2 size={16} /> Saved!</>) : isSaving
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : (<><Save size={16} /> Save Changes</>)}
            </button>
          </div>
        </header>

        <div onDrop={handleDrop} onDragOver={handleDragOver}
          className="flex-1 p-10 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] relative z-0">
          <div className="max-w-3xl mx-auto space-y-4">
            {formStatus === "PUBLISHED" && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">Published Form</p>
                  <p className="text-xs mt-0.5 font-medium text-amber-600">This form is live. Renaming or deleting fields will alter the database table.</p>
                </div>
              </div>
            )}
            {fields.length === 0 && (
              <div className="h-[40vh] border-2 border-slate-200 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-white/50 backdrop-blur-md">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-inner border border-slate-200">
                  <ArrowRight className="text-slate-400 -rotate-90" size={32} />
                </div>
                <p className="text-lg font-bold text-slate-700 tracking-wide">No fields</p>
                <p className="text-sm tracking-wide text-slate-500 mt-2">Drop components from the left sidebar to add fields.</p>
              </div>
            )}
            {fields.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleSortStart} onDragEnd={handleSortEnd} onDragCancel={handleSortCancel}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  {fields.map((field, idx) => (
                    <SortableFieldItem key={field.id} field={field} idx={idx} isActive={activeFieldId === field.id}
                      setActiveFieldId={setActiveFieldId} removeField={removeField} updateField={updateField} fieldIcons={fieldIcons} />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeSortField ? (
                    <div className="flex items-center p-5 gap-5 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-violet-400 shadow-[0_15px_40px_rgba(139,92,246,0.2)] ring-2 ring-violet-400/50 cursor-grabbing rotate-2 scale-[1.02]">
                      <GripVertical size={16} className="text-violet-500" />
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">{fieldIcons[activeSortField.type]}</div>
                      <span className="text-base font-bold text-slate-900">{activeSortField.label || "Enter question title..."}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR — Field Properties OR Rules Panel */}
      <aside className={`w-[400px] bg-white border-l border-slate-200 shadow-[-20px_0_40px_rgba(0,0,0,0.06)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] absolute right-0 h-full z-30 flex flex-col ${activeFieldId && !isDisplayOnly(activeField?.type) ? "translate-x-0" : "translate-x-full"}`}>
        {activeField && (
          <>
            {/* Sidebar header with field type + close */}
            <div className="px-6 pt-6 pb-0 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl text-sm">
                  {fieldIcons[activeField.type]}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Field Settings</p>
                  <p className="text-sm font-black text-slate-900 capitalize">{activeField.type}</p>
                </div>
              </div>
              <button onClick={() => { setActiveFieldId(null); setSidebarTab("properties"); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="px-6 pt-4 pb-0 flex-shrink-0">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSidebarTab("properties")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all ${sidebarTab === "properties" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <SlidersHorizontal size={12} /> Properties
                </button>
                <button
                  onClick={() => setSidebarTab("logic")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all relative ${sidebarTab === "logic" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <GitBranch size={12} /> Logic
                  {(() => {
                    const fn = activeField.label ? activeField.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
                    const count = rules.filter((r) => r.action?.targetField === fn).length;
                    return count > 0 ? (
                      <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${sidebarTab === "logic" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"}`}>{count}</span>
                    ) : null;
                  })()}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b border-slate-100 mt-4 flex-shrink-0" />

            {/* PROPERTIES TAB */}
            {sidebarTab === "properties" && (
              <div className="p-6 space-y-8 overflow-y-auto flex-1">

                {/* Required Toggle */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Behavior</label>
                  <div onClick={() => updateField(activeField.id, "required", !activeField.required)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${activeField.required ? "bg-violet-50 border-violet-200 text-violet-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                    <span className="text-sm font-bold">Required Field</span>
                    <div className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${activeField.required ? "bg-violet-600" : "bg-slate-300"}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${activeField.required ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </div>
                </div>

                {/* Default Value */}
                <DefaultValuePanel activeField={activeField} updateField={updateField} />

                {/* Constraints */}
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> Constraints
                  </label>

                  {(activeField.type === "text" || activeField.type === "textarea") && (
                    <div className="flex flex-col gap-6">
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Character Range</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Min</span>
                            <input type="number" value={activeField.minLength} onChange={(e) => handleNumberInput(e, activeField.id, "minLength")} placeholder="0"
                              className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                          <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                            <input type="number" value={activeField.maxLength} onChange={(e) => handleNumberInput(e, activeField.id, "maxLength")} placeholder="0"
                              className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                        </div>
                      </div>
                      {activeField.type === "text" && (
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Regex Pattern</span>
                          <input type="text" placeholder="e.g. ^[A-Z]+$" value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                            className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-violet-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
                        </div>
                      )}
                    </div>
                  )}

                  {(activeField.type === "radio" || activeField.type === "checkbox" || activeField.type === "select") && (
                    <div className="flex flex-col gap-4">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                        {activeField.type === "select" ? "Data Source Options" : "Choices"}
                      </span>
                      {activeField.type === "select" && (
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                          <button onClick={() => { updateField(activeField.id, "sourceTable", ""); updateField(activeField.id, "sourceColumn", ""); }}
                            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-colors ${!activeField.sourceTable ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Manual List</button>
                          <button onClick={() => { if (!activeField.sourceTable && availableForms.length > 0) updateField(activeField.id, "sourceTable", availableForms[0].id.toString()); }}
                            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-colors ${activeField.sourceTable ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Other Form Data</button>
                        </div>
                      )}
                      {!activeField.sourceTable ? (
                        <div className="space-y-3 mt-2">
                          {activeField.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input type="text" value={opt} onChange={(e) => { const n = [...activeField.options]; n[i] = e.target.value; updateField(activeField.id, "options", n); }}
                                className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
                              <button onClick={() => { const n = activeField.options.filter((_, idx) => idx !== i); updateField(activeField.id, "options", n); }}
                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => updateField(activeField.id, "options", [...(activeField.options || []), `Option ${(activeField.options?.length || 0) + 1}`])}
                            className="w-full p-3 border border-dashed border-violet-300 rounded-xl text-violet-600 font-bold hover:bg-violet-50 text-sm transition-colors mt-2">+ Add Choice</button>
                        </div>
                      ) : (
                        <div className="space-y-4 mt-2">
                          <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Source Form</label>
                            <select value={activeField.sourceTable || ""} onChange={(e) => { updateField(activeField.id, "sourceTable", e.target.value); updateField(activeField.id, "sourceColumn", ""); }}
                              className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm">
                              <option value="" disabled>Select a form...</option>
                              {availableForms.map((f) => <option key={f.id} value={f.id.toString()}>{f.formName}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Data Column (Target)</label>
                            <select value={activeField.sourceColumn || ""} onChange={(e) => updateField(activeField.id, "sourceColumn", e.target.value)}
                              className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" disabled={!activeField.sourceTable}>
                              <option value="" disabled>Select a column to use...</option>
                              {selectedFormFields.map((f) => <option key={f.fieldName} value={f.fieldName}>{f.fieldName} ({f.fieldType})</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeField.type === "number" && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Value Range</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Min</span>
                          <input type="number" value={activeField.min} onChange={(e) => handleNumberInput(e, activeField.id, "min")} placeholder="0"
                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                        <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                          <input type="number" value={activeField.max} onChange={(e) => handleNumberInput(e, activeField.id, "max")} placeholder="0"
                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                      </div>
                    </div>
                  )}

                  {activeField.type === "email" && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Validation Regex</span>
                      <input type="text" placeholder="Custom pattern..." value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                        className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-violet-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
                    </div>
                  )}

                  {activeField.type === "date" && (
                    <div className="space-y-4">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Date Range Limitations</span>
                      <div className="flex flex-col gap-3">
                        <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">After Date</span>
                          <input type="date" value={activeField.afterDate} onChange={(e) => updateField(activeField.id, "afterDate", e.target.value)}
                            className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                        <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Date</span>
                          <input type="date" value={activeField.beforeDate} onChange={(e) => updateField(activeField.id, "beforeDate", e.target.value)}
                            className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                      </div>
                    </div>
                  )}

                  {activeField.type === "phone" && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Regex Pattern (optional)</span>
                      <input type="text" placeholder="e.g. ^\+91[0-9]{10}$" value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                        className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-violet-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 shadow-sm" />
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-[11px] text-slate-500 font-medium">Leave empty to use default validation (7–15 digits).</p>
                      </div>
                    </div>
                  )}

                  {activeField.type === "time" && (
                    <div className="space-y-4">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Time Range</span>
                      <div className="flex flex-col gap-3">
                        <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">After Time</span>
                          <input type="time" value={activeField.afterTime ?? ""} onChange={(e) => updateField(activeField.id, "afterTime", e.target.value)}
                            className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                        <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Time</span>
                          <input type="time" value={activeField.beforeTime ?? ""} onChange={(e) => updateField(activeField.id, "beforeTime", e.target.value)}
                            className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                      </div>
                    </div>
                  )}

                  {activeField.type === "url" && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Validation Info</span>
                      <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
                        <p className="text-xs font-bold text-violet-700">Auto-validated</p>
                        <p className="text-[11px] text-violet-500 mt-1 font-medium leading-relaxed">
                          URL must start with <code className="bg-violet-100 px-1 rounded">http://</code> or <code className="bg-violet-100 px-1 rounded">https://</code>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )} {/* end PROPERTIES TAB */}

            {/* LOGIC TAB */}
            {sidebarTab === "logic" && (() => {
              const fieldName = activeField.label
                ? activeField.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
                : "";

              if (!fieldName) {
                return (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-500">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Question Title Required</p>
                    <p className="text-xs mt-2 text-slate-500 max-w-[200px]">
                      Please enter a question title for this field in the Properties tab before adding logic rules.
                    </p>
                  </div>
                );
              }

              const allFieldNames = fields
                .map((f) => f.label ? f.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "")
                .filter(Boolean);
              // Rules that target this field
              const fieldRules = rules.filter((r) => r.action?.targetField === fieldName);
              // All other rules
              const otherRules = rules.filter((r) => r.action?.targetField !== fieldName);

              const handleFieldRulesChange = (updated) => {
                setRules([...otherRules, ...updated]);
              };

              const addFieldRule = () => {
                const newRule = {
                  _id: Date.now() + Math.random(),
                  condition: { logicalOperator: "AND", conditions: [{ field: "", operator: "EQUALS", value: "" }] },
                  action: { type: "SHOW", targetField: fieldName, message: "" },
                };
                setRules([...rules, newRule]);
              };

              return (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Logic tab info banner */}
                  <div className="mx-4 mt-4 mb-2 px-4 py-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 flex-shrink-0">
                    <GitBranch size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
                      Rules here control when <strong className="font-black">{activeField.label || "this field"}</strong> is shown, hidden, or required.
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <RuleBuilder
                      rules={fieldRules}
                      onChange={handleFieldRulesChange}
                      fieldNames={allFieldNames}
                      defaultTargetField={fieldName}
                      onAddRule={addFieldRule}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Shared footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-center gap-2 bg-white border border-slate-100 py-3 rounded-xl shadow-sm">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Settings are auto-saved</span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}