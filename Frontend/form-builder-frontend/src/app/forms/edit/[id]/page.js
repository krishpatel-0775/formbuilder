"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, 
} from "@dnd-kit/sortable";
import { GripVertical, AlertCircle, ArrowRight, Loader2, Save } from "lucide-react";
import { ENDPOINTS } from "../../../../config/apiConfig";

// Components
import { FieldIcons } from "../../../../components/builder/FieldConstants";
import { SortableFieldItem } from "../../../../components/builder/SortableFieldItem";
import { Sidebar } from "../../../../components/builder/Sidebar";
import { Toolbar } from "../../../../components/builder/Toolbar";
import { FormHeader } from "../../../../components/builder/FormHeader";
import { useAuth } from "../../../../context/AuthContext";

// ─── Display-only types helper ───────────────────────────────────────────────
const DISPLAY_ONLY_TYPES = new Set(["page_break", "heading", "paragraph", "divider"]);
const isDisplayOnly = (type) => DISPLAY_ONLY_TYPES.has(type);

// ─── Main EditFormPage ─────────────────────────────────────────────────────────
export default function EditFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = "TEAM_ADMIN"; // Default for now as backend doesn't provide roles yet

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

  // Load form
  useEffect(() => {
    if (!id || !user) return;
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
          const orderKey = f.fieldName || "";
          return {
            id: f.id * 1000 + Math.floor(Math.random() * 100),
            _dbId: f.id,
            _orderKey: orderKey,
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
  }, [id, user]);

  useEffect(() => {
    const af = fields.find((f) => f.id === activeFieldId);
    if (af?.type === "select" && user) {
      fetch(`http://localhost:9090/api/forms`, { credentials: "include" }).then(r => r.json()).then(r => setAvailableForms(r.data || [])).catch(console.error);
    }
  }, [activeFieldId, fields, user]);

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
        if (isDisplayOnly(field.type)) {
          return { id: field._dbId ?? null, name: `${field.type}_${idx}`, type: field.type, defaultValue: field.label || "" };
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
          if (r.action) { if (!r.action.targetField) delete r.action.targetField; if (!r.action.message) delete r.action.message; }
          if (r.condition) {
            const processCondition = (cond) => {
              const cleaned = { ...cond };
              if (!cleaned.field) delete cleaned.field;
              if (!cleaned.operator) delete cleaned.operator;
              if (cleaned.value === undefined || cleaned.value === null || cleaned.value === "") delete cleaned.value;
              if (!cleaned.logicalOperator) delete cleaned.logicalOperator;
              if (cleaned.conditions && cleaned.conditions.length > 0) cleaned.conditions = cleaned.conditions.map(processCondition);
              else delete cleaned.conditions;
              return cleaned;
            };
            r.condition = processCondition(r.condition);
          }
          return r;
        });

        const currentOrderList = fields.map((f, idx) => {
          if (isDisplayOnly(f.type)) return `${f.type}_${idx}`;
          return f.label ? f.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
        }).filter(Boolean).join(",");

        cleanRules.push({ action: { type: "SHOW", targetField: "__FIELD_ORDER__", message: currentOrderList } });

        await fetch(ENDPOINTS.formRules(id), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanRules), credentials: "include"
        });
      } catch (e) { console.warn("Failed to save rules:", e); }

      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); router.push("/forms/all"); }, 1500);
    } catch (err) { alert(`❌ ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const deleteForm = async () => {
    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone and will preserve the dynamic table data.")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:9090/api/forms/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const errorMsg = await res.text(); throw new Error(errorMsg || "Failed to delete form."); }
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); router.push("/forms/all"); }, 1000);
    } catch (err) { alert(`❌ ${err.message}`); }
    finally { setIsSaving(false); }
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
      <Toolbar handleDragStart={handleDragStart} />
      <main className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />
        <FormHeader
          formName={formName}
          setFormName={setFormName}
          formStatus={formStatus}
          saveForm={saveForm}
          deleteForm={deleteForm}
          isSaving={isSaving}
          showSuccess={showSuccess}
          saveLabel="Save Changes"
          saveIcon={<Save size={16} />}
          userRole={userRole}
        />
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
                      setActiveFieldId={setActiveFieldId} removeField={removeField} updateField={updateField} />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeSortField ? (
                    <div className="flex items-center p-5 gap-5 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-violet-400 shadow-[0_15px_40px_rgba(139,92,246,0.2)] ring-2 ring-violet-400/50 cursor-grabbing rotate-2 scale-[1.02]">
                      <GripVertical size={16} className="text-violet-500" />
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">{FieldIcons[activeSortField.type]}</div>
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
        activeField={activeField} setActiveFieldId={setActiveFieldId} sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
        updateField={updateField} handleNumberInput={handleNumberInput} availableForms={availableForms} 
        selectedFormFields={selectedFormFields} fields={fields} rules={rules} setRules={setRules} isDisplayOnly={isDisplayOnly}
      />
    </div>
  );
}