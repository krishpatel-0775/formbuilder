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
    Rocket
} from "lucide-react";
import { FieldIcons } from "../components/builder/FieldConstants";
import { SortableFieldItem } from "../components/builder/SortableFieldItem";
import { Toolbar } from "../components/builder/Toolbar";
import { FormHeader } from "../components/builder/FormHeader";
import { Sidebar } from "../components/builder/Sidebar";
import { useTeam } from "../context/TeamContext";
import { ENDPOINTS } from "../config/apiConfig";

export default function BuilderPage() {
    const { activeTeam, userRole } = useTeam();
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

    const isDisplayOnly = (type) => ["page_break", "heading", "paragraph", "divider"].includes(type);

    const activeField = useMemo(() => fields.find((f) => f.id === activeFieldId), [fields, activeFieldId]);
    const activeSortField = useMemo(() => fields.find((f) => f.id === activeSortId), [fields, activeSortId]);

    useEffect(() => {
        if (activeField?.type === "select" && activeTeam) {
            fetch(`${ENDPOINTS.FORMS}?teamId=${activeTeam.id}`, { credentials: "include" })
                .then(r => r.json())
                .then(r => setAvailableForms(r.data || []))
                .catch(console.error);
        }
    }, [activeField?.id, activeField?.type, activeTeam]);

    useEffect(() => {
        if (activeField?.type === "select" && activeField?.sourceTable) {
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

    const removeField = (id) => {
        setFields(fields.filter((f) => f.id !== id));
        if (activeFieldId === id) setActiveFieldId(null);
    };

    const generateColumnName = (label) => label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const saveForm = async () => {
        if (!formName.trim()) return alert("Please name your form.");
        const realFields = fields.filter(f => !isDisplayOnly(f.type));
        if (realFields.length === 0) return alert("Add at least one input field.");
        setIsPublishing(true);
        try {
            const formattedFields = fields.map((field, idx) => {
                if (isDisplayOnly(field.type)) {
                    return { name: `${field.type}_${idx}`, type: field.type, defaultValue: field.label || "" };
                }
                if (!field.label) throw new Error("Field label is required");
                let fd = { name: generateColumnName(field.label), type: field.type, required: field.required };
                if (field.type === "toggle") {
                    fd.defaultValue = field.defaultValue === "true" ? "true" : "false";
                    return fd;
                }
                if (field.defaultValue) fd.defaultValue = field.defaultValue;
                if (field.type === "radio" || field.type === "checkbox") fd.options = field.options;
                if (field.type === "select") {
                    if (field.sourceTable && field.sourceColumn) {
                        fd.sourceTable = field.sourceTable;
                        fd.sourceColumn = field.sourceColumn;
                        fd.options = [];
                    } else {
                        fd.options = field.options;
                    }
                }
                if (field.type === "text" || field.type === "textarea") {
                    if (field.minLength) fd.minLength = Number(field.minLength);
                    if (field.maxLength) fd.maxLength = Number(field.maxLength);
                    if (field.type === "text" && field.pattern) fd.pattern = field.pattern;
                }
                if (field.type === "number") {
                    if (field.min) fd.min = Number(field.min);
                    if (field.max) fd.max = Number(field.max);
                }
                if (field.type === "email" && field.pattern) fd.pattern = field.pattern;
                if (field.type === "date") {
                    if (field.afterDate) fd.afterDate = field.afterDate;
                    if (field.beforeDate) fd.beforeDate = field.beforeDate;
                }
                if (field.type === "time") {
                    if (field.afterTime) fd.afterTime = field.afterTime;
                    if (field.beforeTime) fd.beforeTime = field.beforeTime;
                }
                if (field.type === "phone" && field.pattern) fd.pattern = field.pattern;
                return fd;
            });

            if (!activeTeam) return alert("Please select a team before saving.");

            const res = await fetch(ENDPOINTS.FORMS + `?teamId=${activeTeam.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    formName: formName.trim(), 
                    fields: formattedFields, 
                    rules,
                    teamId: activeTeam.id 
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
        <div className="flex h-[calc(100vh-64px)] bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
            <Toolbar
                handleDragStart={handleDragStart}
                addField={(type) => {
                    const id = Date.now();
                    if (isDisplayOnly(type) || type === "page_break") {
                        const newEl = {
                            id,
                            label: type === "page_break"
                                ? `Page ${fields.filter(f => f.type === "page_break").length + 2}`
                                : type === "heading" ? "New Section" : type === "paragraph" ? "Add description here..." : "",
                            type, required: false, defaultValue: "", options: [],
                        };
                        setFields(prev => [...prev, newEl]);
                    } else {
                        const newField = {
                            id, label: "", type: type.toLowerCase(), required: false,
                            defaultValue: type === "toggle" ? "false" : "",
                            minLength: "", maxLength: "", min: "", max: "", pattern: "",
                            beforeDate: "", afterDate: "", afterTime: "", beforeTime: "",
                            options: ["radio", "checkbox", "select"].includes(type.toLowerCase()) ? ["Option 1", "Option 2"] : [],
                            sourceTable: "", sourceColumn: "",
                        };
                        setFields(p => [...p, newField]);
                        setActiveFieldId(id);
                    }
                }}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                
                <FormHeader
                    formName={formName}
                    setFormName={setFormName}
                    saveForm={saveForm}
                    isSaving={isPublishing}
                    showSuccess={showSuccess}
                    saveLabel="Draft Form"
                    saveIcon={<Rocket size={16} />}
                    userRole={userRole}
                />

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
                                </SortableContext>
                                <DragOverlay>
                                    {activeSortField ? (
                                        <div className="flex items-center p-5 gap-5 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-blue-400 shadow-[0_15px_40px_rgba(59,130,246,0.2)] ring-2 ring-blue-400/50 cursor-grabbing rotate-2 scale-[1.02]">
                                            <GripVertical size={16} className="text-blue-500" />
                                            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">
                                                {FieldIcons[activeSortField.type]}
                                            </div>
                                            <span className="text-base font-bold text-slate-900">{activeSortField.label || "Enter question title..."}</span>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                </div>
            </main>

            <Sidebar
                activeFieldId={activeFieldId}
                setActiveFieldId={setActiveFieldId}
                activeField={activeField}
                updateField={updateField}
                rules={rules}
                setRules={setRules}
                availableForms={availableForms}
                selectedFormFields={selectedFormFields}
                sidebarTab={sidebarTab}
                setSidebarTab={setSidebarTab}
                isDisplayOnly={isDisplayOnly}
                fields={fields}
            />
        </div>
    );
}
