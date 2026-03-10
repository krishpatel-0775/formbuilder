"use client";

import { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Type, Hash, Mail, Calendar, Trash2, GripVertical, Rocket, X,
    AlertCircle, ShieldCheck, CheckCircle2, ListPlus, ArrowRight,
    AlignLeft, CircleDot, CheckSquare, Phone, Clock, Link, SlidersHorizontal,
    GitBranch, AlertTriangle, ChevronRight, Heading, Pilcrow, Minus, ToggleLeft, ToggleRight, ToggleRight as ToggleOn
} from "lucide-react";
import RuleBuilder from "../components/RuleBuilder";

// ─── Default Value Panel ───────────────────────────────────────────────────────
function DefaultValuePanel({ activeField, updateField, accentColor = "blue" }) {
    const textTypes = ["text", "email", "url", "phone", "number"];
    const ring = `focus:border-${accentColor}-400 focus:ring-4 focus:ring-${accentColor}-100`;
    const base = `w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm ${ring}`;

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal size={14} /> Default Value
            </label>

            {textTypes.includes(activeField.type) && (
                <input
                    type={activeField.type === "number" ? "number" : "text"}
                    placeholder="Pre-filled value..."
                    value={activeField.defaultValue ?? ""}
                    onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
                    className={base}
                />
            )}

            {activeField.type === "textarea" && (
                <textarea
                    rows={3}
                    placeholder="Pre-filled value..."
                    value={activeField.defaultValue ?? ""}
                    onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
                    className={`${base} resize-none`}
                />
            )}

            {activeField.type === "date" && (
                <input type="date" value={activeField.defaultValue ?? ""}
                    onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
                    className={base} />
            )}

            {activeField.type === "time" && (
                <input type="time" value={activeField.defaultValue ?? ""}
                    onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
                    className={base} />
            )}

            {(activeField.type === "radio" || activeField.type === "select") &&
                !activeField.sourceTable &&
                activeField.options?.length > 0 && (
                    <select value={activeField.defaultValue ?? ""}
                        onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
                        className={base}>
                        <option value="">None (no default)</option>
                        {activeField.options.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}

            {activeField.type === "checkbox" && activeField.options?.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[11px] text-slate-400 font-medium">Pre-check options:</p>
                    {activeField.options.map((opt, i) => {
                        const defaults = activeField.defaultValue
                            ? activeField.defaultValue.split(",").map((v) => v.trim()) : [];
                        const checked = defaults.includes(opt);
                        return (
                            <label key={i}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"}`}>
                                <input type="checkbox" checked={checked}
                                    onChange={() => {
                                        const current = activeField.defaultValue
                                            ? activeField.defaultValue.split(",").map((v) => v.trim()) : [];
                                        const updated = checked ? current.filter((v) => v !== opt) : [...current, opt];
                                        updateField(activeField.id, "defaultValue", updated.join(","));
                                    }}
                                    className="w-4 h-4 rounded text-blue-600" />
                                <span className="text-sm font-bold">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {activeField.type === "select" && activeField.sourceTable && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-medium">
                        Default value is not available for dynamic data source dropdowns.
                    </p>
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

// ─── Helper ──────────────────────────────────────────────────────────────────
const DISPLAY_ONLY_TYPES = new Set(["page_break", "heading", "paragraph", "divider"]);
const isDisplayOnly = (type) => DISPLAY_ONLY_TYPES.has(type);

// ─── Sortable Field Item ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function SortableFieldItem({ field, idx, isActive, setActiveFieldId, removeField, updateField, fieldIcons }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1, opacity: isDragging ? 0.4 : 1 };

    // ── Page Break special render
    if (field.type === "page_break") {
        return (
            <div ref={setNodeRef} style={style}
                className="relative flex items-center group">
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

    // ── Heading static element
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
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className={`opacity-0 group-hover:opacity-100 ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0 mt-3 ${isDragging ? "hidden" : ""}`}>
                    <Trash2 size={14} />
                </button>
            </div>
        );
    }

    // ── Paragraph static element
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
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className={`opacity-0 group-hover:opacity-100 ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0 mt-3 ${isDragging ? "hidden" : ""}`}>
                    <Trash2 size={14} />
                </button>
            </div>
        );
    }

    // ── Divider static element
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

    // ── Toggle field — live switch preview in canvas
    if (field.type === "toggle") {
        const isOn = field.defaultValue === "true";
        return (
            <div ref={setNodeRef} style={style} onClick={() => setActiveFieldId(field.id)}
                className={`group relative flex items-center p-5 gap-5 bg-white rounded-[1.5rem] border shadow-sm transition-all duration-300 cursor-pointer
                    ${isActive ? "border-blue-400 shadow-[0_8px_30px_rgba(59,130,246,0.12)] ring-1 ring-blue-400"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}>
                <div {...attributes} {...listeners}
                    className="flex flex-col items-center justify-center w-8 cursor-grab active:cursor-grabbing hover:bg-slate-50 p-1 rounded-lg transition-colors">
                    <span className="text-[10px] font-black text-slate-400 mb-1 pointer-events-none">{idx + 1}</span>
                    <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors pointer-events-none" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">
                    {isOn ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-slate-400" />}
                </div>
                <div className="flex-1">
                    <input placeholder="Toggle label..." value={field.label}
                        onChange={(e) => updateField(field.id, "label", e.target.value)}
                        className="w-full text-base font-bold text-slate-900 bg-transparent outline-none placeholder:font-medium placeholder:text-slate-400"
                        onClick={(e) => e.stopPropagation()} />
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 block"
                        style={{ color: isOn ? "#10b981" : "#94a3b8" }}>
                        Default: {isOn ? "ON" : "OFF"}
                    </span>
                </div>
                {/* Live default toggle */}
                <div onClick={(e) => { e.stopPropagation(); updateField(field.id, "defaultValue", isOn ? "false" : "true"); }}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ${isOn ? "bg-emerald-500" : "bg-slate-200"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? "translate-x-7" : "translate-x-1"}`} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className={`opacity-0 group-hover:opacity-100 flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 ${isDragging ? "hidden" : ""}`}>
                    <Trash2 size={16} />
                </button>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} onClick={() => setActiveFieldId(field.id)}
            className={`group relative flex items-center p-5 gap-5 bg-white rounded-[1.5rem] border shadow-sm transition-all duration-300 cursor-pointer ${isActive ? "border-blue-400 shadow-[0_8px_30px_rgba(59,130,246,0.12)] ring-1 ring-blue-400"
                : "border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-800"}`}>
            <div {...attributes} {...listeners}
                className="flex flex-col items-center justify-center w-8 cursor-grab active:cursor-grabbing hover:bg-slate-50 p-1 rounded-lg transition-colors">
                <span className="text-[10px] font-black text-slate-400 mb-1 pointer-events-none">{idx + 1}</span>
                <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors pointer-events-none" />
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">
                {fieldIcons[field.type]}
            </div>
            <div className="flex-1">
                <input placeholder="Enter question title..." value={field.label}
                    onChange={(e) => updateField(field.id, "label", e.target.value)}
                    className="w-full text-base font-bold text-slate-900 bg-transparent outline-none placeholder:font-medium placeholder:text-slate-400"
                    onClick={(e) => e.stopPropagation()} />
                <div className="flex items-center gap-2 mt-1">
                    {field.required && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">* REQUIRED</span>}
                    {field.defaultValue && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Default set
                        </span>
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

// ─── Main BuilderPage ──────────────────────────────────────────────────────────
export default function BuilderPage() {
    const [formName, setFormName] = useState("");
    const [fields, setFields] = useState([]);
    const [activeFieldId, setActiveFieldId] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeSortId, setActiveSortId] = useState(null);
    const [availableForms, setAvailableForms] = useState([]);
    const [selectedFormFields, setSelectedFormFields] = useState([]);
    const [rules, setRules] = useState([]);
    const [sidebarTab, setSidebarTab] = useState("properties"); // "properties" | "logic"

    const fieldIcons = {
        text: <Type size={18} />, textarea: <AlignLeft size={18} />, number: <Hash size={18} />,
        email: <Mail size={18} />, date: <Calendar size={18} />, phone: <Phone size={18} />,
        time: <Clock size={18} />, url: <Link size={18} />, radio: <CircleDot size={18} />,
        checkbox: <CheckSquare size={18} />, select: <ListPlus size={18} />,
        toggle: <ToggleRight size={18} />,
        page_break: <ChevronRight size={18} />,
        heading: <Heading size={18} />,
        paragraph: <Pilcrow size={18} />,
        divider: <Minus size={18} />,
    };

    // Component types shown in the left sidebar
    const regularFieldTypes = ["text", "textarea", "number", "email", "date", "phone", "time", "url", "radio", "checkbox", "select", "toggle"];
    const staticElementTypes = [
        { type: "heading",   label: "Heading",   desc: "Section title",       color: "amber",  icon: <Heading size={16} /> },
        { type: "paragraph", label: "Paragraph",  desc: "Description text",    color: "sky",    icon: <Pilcrow size={16} /> },
        { type: "divider",   label: "Divider",    desc: "Visual separator",    color: "slate",  icon: <Minus size={16} /> },
        { type: "page_break",label: "Page Break", desc: "Split form into pages",color: "indigo", icon: <ChevronRight size={16} /> },
    ];

    const activeField = useMemo(() => fields.find((f) => f.id === activeFieldId), [fields, activeFieldId]);
    const activeSortField = useMemo(() => fields.find((f) => f.id === activeSortId), [fields, activeSortId]);

    useEffect(() => {
        if (activeField?.type === "select") {
            fetch("http://localhost:9090/api/forms", { credentials: "include" }).then(r => r.json()).then(r => setAvailableForms(r.data || [])).catch(console.error);
        }
    }, [activeField?.id, activeField?.type]);

    useEffect(() => {
        if (activeField?.type === "select" && activeField?.sourceTable) {
            fetch(`http://localhost:9090/api/forms/${activeField.sourceTable}`, { credentials: "include" }).then(r => r.json()).then(r => setSelectedFormFields(r.data?.fields || [])).catch(console.error);
        } else { setSelectedFormFields([]); }
    }, [activeField?.sourceTable, activeField?.id, activeField?.type]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (e, type) => e.dataTransfer.setData("fieldType", type);

    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("fieldType");
        if (!type) return;

        // Display-only types (page_break, heading, paragraph, divider)
        if (isDisplayOnly(type) || type === "page_break") {
            const newEl = {
                id: Date.now(),
                label: type === "page_break"
                    ? `Page ${fields.filter(f => f.type === "page_break").length + 2}`
                    : type === "heading" ? "New Section" : type === "paragraph" ? "Add description here..." : "",
                type,
                required: false, defaultValue: "", options: [],
            };
            setFields([...fields, newEl]);
            return;
        }

        const newField = {
            id: Date.now(), label: "", type: type.toLowerCase(), required: false,
            defaultValue: type === "toggle" ? "false" : "",
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
            id: Date.now(), label: `Page ${breakCount + 1}`, type: "page_break",
            required: false, defaultValue: "", options: [],
        };
        setFields([...fields, newBreak]);
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleSortStart = (e) => setActiveSortId(e.active.id);
    const handleSortEnd = (e) => {
        const { active, over } = e;
        if (active.id !== over?.id) {
            setFields((items) => {
                const oi = items.findIndex((i) => i.id === active.id);
                const ni = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oi, ni);
            });
        }
        setActiveSortId(null);
    };
    const handleSortCancel = () => setActiveSortId(null);

    const updateField = (id, key, value) => {
        if (key === "label") {
            setFields((p) => {
                const field = p.find(f => f.id === id);
                if (field && field.label !== value) {
                    const oldCol = field.label ? field.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
                    const newCol = value ? value.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
                    if (oldCol && newCol && oldCol !== newCol) {
                        setRules(prevRules => prevRules.map(r => {
                            let newRule = { ...r };
                            if (newRule.action?.targetField === oldCol) {
                                newRule.action = { ...newRule.action, targetField: newCol };
                            }
                            if (newRule.condition?.conditions) {
                                newRule.condition.conditions = newRule.condition.conditions.map(c =>
                                    c.field === oldCol ? { ...c, field: newCol } : c
                                );
                            }
                            return newRule;
                        }));
                    }
                }
                return p.map((f) => f.id === id ? { ...f, [key]: value } : f);
            });
        } else {
            setFields((p) => p.map((f) => f.id === id ? { ...f, [key]: value } : f));
        }
    };
    const removeField = (id) => { setFields(fields.filter((f) => f.id !== id)); if (activeFieldId === id) setActiveFieldId(null); };
    const handleNumberInput = (e, id, key) => { const v = e.target.value; if (v === "" || /^\d+$/.test(v)) updateField(id, key, v); };
    const generateColumnName = (label) => label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const saveForm = async () => {
        if (!formName.trim()) return alert("Please name your form.");
        const realFields = fields.filter(f => !isDisplayOnly(f.type));
        if (realFields.length === 0) return alert("Add at least one input field.");
        setIsPublishing(true);
        try {
            const formattedFields = fields.map((field, idx) => {
                // Display-only types — persist with placeholder name, no column in DB
                // Store the admin-typed label text in defaultValue so the public form can render it
                if (isDisplayOnly(field.type)) {
                    return { name: `${field.type}_${idx}`, type: field.type, defaultValue: field.label || "" };
                }
                if (!field.label) throw new Error("Field label is required");
                let fd = { name: generateColumnName(field.label), type: field.type, required: field.required };
                if (field.type === "toggle") {
                    // Store the boolean default ("true"/"false") exactly
                    fd.defaultValue = field.defaultValue === "true" ? "true" : "false";
                    return fd;
                }
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
            const res = await fetch("http://localhost:9090/api/forms", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ formName: formName.trim(), fields: formattedFields, rules }),
                credentials: "include"
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to save form."); }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setFormName(""); setFields([]); setActiveFieldId(null);
        } catch (err) { alert(`❌ ${err.message}`); }
        finally { setIsPublishing(false); }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">

            {/* LEFT SIDEBAR */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <ListPlus className="text-blue-600" size={20} />
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Components</h2>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium tracking-wide">Drag & drop to build</p>
                </div>
                <div className="p-6 space-y-3 overflow-y-auto">
                    {/* ── Static Elements group ── */}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Static Elements</p>
                    {staticElementTypes.map(({ type, label, desc, color, icon }) => (
                        <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
                            onClick={() => {
                                const newEl = {
                                    id: Date.now(),
                                    label: type === "page_break"
                                        ? `Page ${fields.filter(f => f.type === "page_break").length + 2}`
                                        : type === "heading" ? "New Section" : type === "paragraph" ? "Add description here..." : "",
                                    type, required: false, defaultValue: "", options: [],
                                };
                                setFields(prev => [...prev, newEl]);
                            }}
                            className={`flex items-center gap-4 p-3.5 rounded-2xl border shadow-sm cursor-pointer transition-all group hover:-translate-y-0.5
                                bg-${color}-50 border-${color}-200 hover:bg-${color}-100 hover:border-${color}-300`}>
                            <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-${color}-100 border border-${color}-200 text-${color}-500 flex-shrink-0`}>
                                {icon}
                            </div>
                            <div>
                                <span className={`text-sm font-bold text-${color}-700 group-hover:text-${color}-900`}>{label}</span>
                                <p className={`text-[10px] text-${color}-500 mt-0.5`}>{desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* ── Input Fields group ── */}
                    <div className="border-t border-slate-100 pt-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Input Fields</p>
                    </div>
                    {regularFieldTypes.map((type) => (
                        <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-grab hover:bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all group hover:-translate-y-0.5">
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 text-slate-400 transition-all duration-300">
                                {fieldIcons[type]}
                            </div>
                            <div>
                                <span className="text-sm font-bold capitalize text-slate-700 group-hover:text-slate-900 transition-colors">{type}</span>
                                <p className="text-[10px] text-slate-500 mt-0.5">Input field</p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* CENTER CANVAS */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                <header className="h-20 border-b border-slate-200 px-8 flex items-center justify-between z-10 backdrop-blur-xl bg-white/80">
                    <div className="relative w-full max-w-lg">
                        <input type="text" placeholder="Enter Form Title..." value={formName} onChange={(e) => setFormName(e.target.value)}
                            className="text-2xl font-black bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-slate-400 text-slate-900 tracking-tight" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={saveForm} disabled={isPublishing || showSuccess}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md ${showSuccess ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-slate-900 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20"}`}>
                            {showSuccess ? (<><CheckCircle2 size={16} /> Success</>) : isPublishing
                                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                : (<><Rocket size={16} /> Draft Form</>)}
                        </button>
                    </div>
                </header>
                <div onDrop={handleDrop} onDragOver={handleDragOver}
                    className="flex-1 p-10 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] relative z-0">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {fields.length === 0 && (
                            <div className="h-[40vh] border-2 border-slate-200 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-white/50 backdrop-blur-md">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 shadow-inner border border-slate-200">
                                    <ArrowRight className="text-slate-400 -rotate-90" size={32} />
                                </div>
                                <p className="text-lg font-bold text-slate-700 tracking-wide">Canvas is empty</p>
                                <p className="text-sm tracking-wide text-slate-500 mt-2">Drop components from the left sidebar to start building.</p>
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
                                        <div className="flex items-center p-5 gap-5 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-blue-400 shadow-[0_15px_40px_rgba(59,130,246,0.2)] ring-2 ring-blue-400/50 cursor-grabbing rotate-2 scale-[1.02]">
                                            <GripVertical size={16} className="text-blue-500" />
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

                                {activeField.type === "toggle" ? (
                                    <>
                                        {/* Toggle default state */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <ToggleRight size={14} /> Default State
                                            </label>
                                            <div onClick={() => updateField(activeField.id, "defaultValue", activeField.defaultValue === "true" ? "false" : "true")}
                                                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${activeField.defaultValue === "true" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                                                <div>
                                                    <span className="text-sm font-bold block">{activeField.defaultValue === "true" ? "Default ON" : "Default OFF"}</span>
                                                    <span className="text-[11px] text-slate-500">Click to toggle default state</span>
                                                </div>
                                                <div className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${activeField.defaultValue === "true" ? "bg-emerald-500" : "bg-slate-300"}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeField.defaultValue === "true" ? "translate-x-7" : "translate-x-1"}`} />
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <p className="text-[11px] text-slate-500 font-medium">Stored as <code className="bg-slate-100 px-1 rounded">BOOLEAN</code>. Submits <code className="bg-slate-100 px-1 rounded">true</code> / <code className="bg-slate-100 px-1 rounded">false</code>.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Behavior</label>
                                            <div onClick={() => updateField(activeField.id, "required", !activeField.required)}
                                                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${activeField.required ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                                                <span className="text-sm font-bold">Required Field</span>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${activeField.required ? "bg-blue-600" : "bg-slate-300"}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${activeField.required ? "translate-x-6" : "translate-x-1"}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Required Toggle */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Behavior</label>
                                            <div onClick={() => updateField(activeField.id, "required", !activeField.required)}
                                                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${activeField.required ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                                                <span className="text-sm font-bold">Required Field</span>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${activeField.required ? "bg-blue-600" : "bg-slate-300"}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${activeField.required ? "translate-x-6" : "translate-x-1"}`} />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Default Value */}
                                        <DefaultValuePanel activeField={activeField} updateField={updateField} accentColor="blue" />
                                    </>
                                )}

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
                                                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                                    <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                                                        <input type="number" value={activeField.maxLength} onChange={(e) => handleNumberInput(e, activeField.id, "maxLength")} placeholder="0"
                                                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                                </div>
                                            </div>
                                            {activeField.type === "text" && (
                                                <div className="space-y-3">
                                                    <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Regex Pattern</span>
                                                    <input type="text" placeholder="e.g. ^[A-Z]+$" value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                                                        className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-blue-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm" />
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
                                                                className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" />
                                                            <button onClick={() => { const n = activeField.options.filter((_, idx) => idx !== i); updateField(activeField.id, "options", n); }}
                                                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => updateField(activeField.id, "options", [...(activeField.options || []), `Option ${(activeField.options?.length || 0) + 1}`])}
                                                        className="w-full p-3 border border-dashed border-blue-300 rounded-xl text-blue-600 font-bold hover:bg-blue-50 text-sm transition-colors mt-2">+ Add Choice</button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 mt-2">
                                                    <div className="flex flex-col space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400">Source Form</label>
                                                        <select value={activeField.sourceTable || ""} onChange={(e) => { updateField(activeField.id, "sourceTable", e.target.value); updateField(activeField.id, "sourceColumn", ""); }}
                                                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm">
                                                            <option value="" disabled>Select a form...</option>
                                                            {availableForms.map((f) => <option key={f.id} value={f.id.toString()}>{f.formName}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400">Data Column (Target)</label>
                                                        <select value={activeField.sourceColumn || ""} onChange={(e) => updateField(activeField.id, "sourceColumn", e.target.value)}
                                                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" disabled={!activeField.sourceTable}>
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
                                                        className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                                <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                                                    <input type="number" value={activeField.max} onChange={(e) => handleNumberInput(e, activeField.id, "max")} placeholder="0"
                                                        className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                            </div>
                                        </div>
                                    )}

                                    {activeField.type === "email" && (
                                        <div className="space-y-3">
                                            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Validation Regex</span>
                                            <input type="text" placeholder="Custom pattern..." value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                                                className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-blue-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm" />
                                        </div>
                                    )}

                                    {activeField.type === "date" && (
                                        <div className="space-y-4">
                                            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Date Range Limitations</span>
                                            <div className="flex flex-col gap-3">
                                                <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">After Date</span>
                                                    <input type="date" value={activeField.afterDate} onChange={(e) => updateField(activeField.id, "afterDate", e.target.value)}
                                                        className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                                <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Date</span>
                                                    <input type="date" value={activeField.beforeDate} onChange={(e) => updateField(activeField.id, "beforeDate", e.target.value)}
                                                        className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                            </div>
                                        </div>
                                    )}

                                    {activeField.type === "phone" && (
                                        <div className="space-y-3">
                                            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Regex Pattern (optional)</span>
                                            <input type="text" placeholder="e.g. ^\+91[0-9]{10}$" value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                                                className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-blue-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm" />
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
                                                        className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                                <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Time</span>
                                                    <input type="time" value={activeField.beforeTime ?? ""} onChange={(e) => updateField(activeField.id, "beforeTime", e.target.value)}
                                                        className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                                            </div>
                                        </div>
                                    )}

                                    {activeField.type === "url" && (
                                        <div className="space-y-3">
                                            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Validation Info</span>
                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                                <p className="text-xs font-bold text-blue-700">Auto-validated</p>
                                                <p className="text-[11px] text-blue-500 mt-1 font-medium leading-relaxed">
                                                    URL must start with <code className="bg-blue-100 px-1 rounded">http://</code> or <code className="bg-blue-100 px-1 rounded">https://</code>.
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
