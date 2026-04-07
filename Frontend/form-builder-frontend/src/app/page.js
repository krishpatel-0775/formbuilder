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
} from "@dnd-kit/sortable";
import {
    ArrowRight,
    GripVertical,
    Rocket,
    MousePointer2,
    Sparkles,
    Loader2
} from "lucide-react";
import { FieldIcons } from "../components/builder/FieldConstants";
import { SortableFieldItem } from "../components/builder/SortableFieldItem";
import { Toolbar } from "../components/builder/Toolbar";
import { FormHeader } from "../components/builder/FormHeader";
import { Sidebar } from "../components/builder/Sidebar";
import { FormPreview } from "../components/builder/FormPreview";
import { ENDPOINTS } from "../config/apiConfig";

export default function BuilderPage() {
    const userRole = "SYSTEM_ADMIN";
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
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const isDisplayOnly = (type) => ["page_break", "heading", "paragraph", "divider"].includes(type);

    const activeField = useMemo(() => fields.find((f) => f.id === activeFieldId), [fields, activeFieldId]);
    const activeSortField = useMemo(() => fields.find((f) => f.id === activeSortId), [fields, activeSortId]);

    useEffect(() => {
        if (["select", "radio", "checkbox"].includes(activeField?.type)) {
            fetch(ENDPOINTS.FORMS, { credentials: "include" })
                .then(r => r.json())
                .then(r => setAvailableForms(r.data || []))
                .catch(console.error);
        }
    }, [activeField?.id, activeField?.type]);

    useEffect(() => {
        if (["select", "radio", "checkbox"].includes(activeField?.type) && activeField?.sourceTable) {
            fetch(`${ENDPOINTS.FORMS}/${activeField.sourceTable}`, { credentials: "include" })
                .then(r => r.json())
                .then(r => setSelectedFormFields(r.data?.fields || []))
                .catch(console.error);
        } else {
            setSelectedFormFields([]);
        }
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
            id: Date.now(), label: "", key: "", type: type.toLowerCase(), required: false,
            defaultValue: type === "toggle" ? "false" : "",
            minLength: "", maxLength: "", min: "", max: "", pattern: "",
            beforeDate: "", afterDate: "", afterTime: "", beforeTime: "",
            options: ["radio", "checkbox", "select"].includes(type.toLowerCase()) ? ["Option 1", "Option 2"] : [],
            sourceTable: "", sourceColumn: "",
        };
        setFields([...fields, newField]);
        setActiveFieldId(newField.id);
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
                return p.map((f) => f.id === id ? { 
                    ...f, 
                    [key]: value, 
                    key: key === "label" && (!f.key || f.key === generateColumnName(f.label)) ? generateColumnName(value) : f.key 
                } : f);
            });
        } else {
            setFields((p) => p.map((f) => f.id === id ? { ...f, [key]: value } : f));
        }
    };

    const removeField = (id) => {
        setFields(fields.filter((f) => f.id !== id));
        if (activeFieldId === id) setActiveFieldId(null);
    };

    const handleNumberInput = (e, id, key) => {
        const value = e.target.value === "" ? "" : Number(e.target.value);
        updateField(id, key, value);
    };

    const generateColumnName = (label) => label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const saveForm = async () => {
        if (!formName.trim() || formName.trim().length < 3) {
            return alert("Please give your form a name (at least 3 characters).");
        }
        const realFields = fields.filter(f => !isDisplayOnly(f.type));
        if (realFields.length === 0) return alert("Add at least one input field.");
        setIsPublishing(true);
        try {
            const formattedFields = fields.map((field, idx) => {
                if (isDisplayOnly(field.type)) {
                    return { name: `${field.type}_${idx}`, type: field.type, defaultValue: field.label || "" };
                }
                if (!field.label) throw new Error("Field label is required");
                let fd = { 
                    name: field.label, 
                    fieldKey: field.key || generateColumnName(field.label),
                    type: field.type, 
                    required: field.required, 
                    isReadOnly: field.isReadOnly, 
                    isMultiSelect: !!field.isMultiSelect 
                };

                if (field.type === "toggle") {
                    fd.defaultValue = field.defaultValue === "true" ? "true" : "false";
                    return fd;
                }
                if (field.defaultValue) fd.defaultValue = field.defaultValue;
                if (field.placeholder) fd.placeholder = field.placeholder;
                if (field.helperText) fd.helperText = field.helperText;
                if (["radio", "checkbox", "select"].includes(field.type)) {
                    if (field.sourceTable && field.sourceColumn) {
                        fd.sourceTable = field.sourceTable;
                        fd.sourceColumn = field.sourceColumn;
                        fd.options = [];
                    } else {
                        fd.options = field.options;
                    }
                }



                if (["text", "textarea", "email", "phone", "url"].includes(field.type)) {
                    if (field.minLength) fd.minLength = Number(field.minLength);
                    if (field.maxLength) fd.maxLength = Number(field.maxLength);
                    if (field.pattern) fd.pattern = field.pattern;
                }
                if (field.type === "number") {
                    if (field.min) fd.min = Number(field.min);
                    if (field.max) fd.max = Number(field.max);
                }
                if (field.type === "date") {
                    if (field.afterDate) fd.afterDate = field.afterDate;
                    if (field.beforeDate) fd.beforeDate = field.beforeDate;
                }
                if (field.type === "time") {
                    if (field.afterTime) fd.afterTime = field.afterTime;
                    if (field.beforeTime) fd.beforeTime = field.beforeTime;
                }
                if (field.type === "file_upload") {
                    fd.allowedFileTypes = field.allowedFileTypes;
                    fd.maxFileSize = field.maxFileSize;
                }
                return fd;
            });

            const res = await fetch(ENDPOINTS.FORMS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formName: formName.trim(),
                    fields: formattedFields,
                    rules
                }),
                credentials: "include"
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save form.");
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setFormName("");
            setFields([]);
            setActiveFieldId(null);
        } catch (err) {
            alert(`❌ ${err.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="flex h-full bg-background text-slate-900 font-sans overflow-hidden">
            <Toolbar handleDragStart={handleDragStart} />

            <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

                <FormHeader
                    formName={formName}
                    setFormName={setFormName}
                    saveForm={saveForm}
                    isSaving={isPublishing}
                    showSuccess={showSuccess}
                    saveLabel="Draft Form"
                    saveIcon={<Rocket size={18} strokeWidth={2.5} />}
                    userRole={userRole}
                    onPreview={() => setIsPreviewOpen(true)}
                />

                <div onDrop={handleDrop} onDragOver={handleDragOver}
                    className="flex-1 p-10 overflow-auto custom-scrollbar relative z-0">
                    <div className="max-w-3xl mx-auto space-y-6 pb-20">
                        {fields.length === 0 && (
                            <div className="h-[40vh] border-2 border-slate-200 border-dashed rounded-[3rem] flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm group hover:border-primary/30 transition-colors">
                                <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center mb-8 shadow-2xl shadow-slate-200/50 group-hover:scale-110 transition-transform duration-500">
                                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                        <MousePointer2 size={32} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Empty Workspace</h3>
                                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Drag components here to start</p>
                                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                                    <Sparkles size={14} className="text-primary" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Build something premium</span>
                                </div>
                            </div>
                        )}
                        {fields.length > 0 && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleSortStart} onDragEnd={handleSortEnd} onDragCancel={handleSortCancel}>
                                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {fields.map((field, idx) => (
                                            <SortableFieldItem
                                                key={field.id}
                                                field={field}
                                                idx={idx}
                                                isActive={activeFieldId === field.id}
                                                setActiveFieldId={setActiveFieldId}
                                                removeField={removeField}
                                                updateField={updateField}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeSortId ? (
                                        <div className="flex items-center scale-[1.05] p-6 gap-6 bg-white/90 backdrop-blur-xl rounded-[2rem] border-2 border-primary shadow-[0_20px_50px_rgba(59,130,246,0.2)] cursor-grabbing rotate-1 transition-all">
                                            <GripVertical size={20} className="text-primary" />
                                            <div className="w-14 h-14 flex items-center justify-center bg-primary/5 text-primary rounded-2xl border border-primary/10 shadow-inner">
                                                {FieldIcons[activeSortField?.type]}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Architectural Component</p>
                                                <span className="text-lg font-black text-slate-900 tracking-tight">{activeSortField?.label || "Untitled Component"}</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                </div>
            </main>

            <Sidebar
                activeField={activeField}
                setActiveFieldId={setActiveFieldId}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                updateField={updateField}
                handleNumberInput={handleNumberInput}
                availableForms={availableForms}
                selectedFormFields={selectedFormFields}
                fields={fields}
                rules={rules}
                setRules={setRules}
                isDisplayOnly={isDisplayOnly}
                activeFieldId={activeFieldId}
            />

            <FormPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                fields={fields}
                formName={formName}
            />
        </div>
    );
}
