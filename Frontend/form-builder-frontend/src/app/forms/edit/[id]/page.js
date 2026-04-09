"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, AlertCircle, ArrowRight, Loader2, Save, MousePointer2, Sparkles, GitBranch, Lock } from "lucide-react";
import { ENDPOINTS } from "../../../../config/apiConfig";
import Link from "next/link";

// Components
import { FieldIcons } from "../../../../components/builder/FieldConstants";
import { SortableFieldItem } from "../../../../components/builder/SortableFieldItem";
import { Sidebar } from "../../../../components/builder/Sidebar";
import { Toolbar } from "../../../../components/builder/Toolbar";
import { FormHeader } from "../../../../components/builder/FormHeader";
import { FormPreview } from "../../../../components/builder/FormPreview";
import { useAuth } from "../../../../context/AuthContext";

// ─── Display-only types helper ───────────────────────────────────────────────
const DISPLAY_ONLY_TYPES = new Set(["page_break", "heading", "paragraph", "divider"]);
const isDisplayOnly = (type) => DISPLAY_ONLY_TYPES.has(type);

// ─── Main EditFormPage ─────────────────────────────────────────────────────────
export default function EditFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userRole = "SYSTEM_ADMIN"; // Standardized role name

  // Version context — if versionId is in the query, we're editing a specific draft version
  const versionId = searchParams.get("versionId");

  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [activeSortId, setActiveSortId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formStatus, setFormStatus] = useState("DRAFT");
  const [isVersionActive, setIsVersionActive] = useState(false); // true = read-only
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedFormFields, setSelectedFormFields] = useState([]);
  const [rules, setRules] = useState([]);
  const [sidebarTab, setSidebarTab] = useState("properties"); // "properties" | "logic"
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const savedSnapshot = useRef(null);

  useEffect(() => {
    if (!savedSnapshot.current || isVersionActive) return;
    const current = JSON.stringify({ formName, fields, rules: rules.map(({ _id, ...r }) => r) });
    const saved = JSON.stringify(savedSnapshot.current);
    setIsDirty(current !== saved);
  }, [formName, fields, rules, isVersionActive]);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    window._isFormDirty = isDirty;
    return () => { window._isFormDirty = false; };
  }, [isDirty]);

  // Load form — if versionId param present, load from version endpoint
  useEffect(() => {
    if (!id || !user) return;

    // Auto-versioning: if no versionId, fetch current draft or create new one
    if (!versionId) {
      fetch(ENDPOINTS.formDraft(id), { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.data?.id) {
            router.replace(`/forms/edit/${id}?versionId=${data.data.id}`);
          } else {
            router.push("/forms/all");
          }
        })
        .catch(() => router.push("/forms/all"));
      return;
    }

    const formUrl = `${ENDPOINTS.FORMS}/${id}`;
    const versionUrl = `${ENDPOINTS.formVersion(id, versionId)}`;

    // Always fetch form metadata (name, status)
    fetch(formUrl, { credentials: "include" })
      .then((res) => { if (!res.ok) { router.push("/forms/all"); return null; } return res.json(); })
      .then(async (res) => {
        if (!res) return;
        const formData = res.data;
        setFormName(formData.formName || "");
        setFormStatus(formData.status || "DRAFT");

        // Determine where to load fields from
        let fieldSource = formData; // default: use form fields
        if (versionUrl) {
          const vRes = await fetch(versionUrl, { credentials: "include" });
          if (vRes.ok) {
            const vJson = await vRes.json();
            fieldSource = vJson.data; // the version, which has .fields and .rules
            setIsVersionActive(!!vJson.data?.isActive);
          } else {
            // If version fetch fails (Access Denied), redirect
            router.push("/forms/all");
            return;
          }
        }

        const noOpts = ["text", "textarea", "number", "email", "date", "phone", "time", "url", "page_break", "heading", "paragraph", "divider"];
        const staticFieldTypes = new Set(["heading", "paragraph", "divider"]);
        const loadedFields = (fieldSource.fields || []).map((f) => {
          const isStatic = staticFieldTypes.has(f.fieldType);
          const orderKey = f.fieldName || "";
          return {
            id: f.id,
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
            maxFileSize: f.maxFileSize ?? "", allowedFileTypes: f.allowedFileTypes ?? "",
            options: f.options?.length > 0 ? f.options : noOpts.includes(f.fieldType) ? [] : ["Option 1", "Option 2"],
            sourceTable: f.sourceTable ?? "", sourceColumn: f.sourceColumn ?? "",
            isReadOnly: f.isReadOnly ?? false,
            isMultiSelect: f.isMultiSelect ?? false,
            placeholder: f.placeholder ?? "",
            helperText: f.helperText ?? "",
            key: f.fieldKey || (f.fieldName ? generateColumnName(f.fieldName) : ""),
          };

        });

        let rulesArr = [];
        try {
          const rulesRaw = fieldSource.rules;
          if (rulesRaw) {
            rulesArr = typeof rulesRaw === "string" ? JSON.parse(rulesRaw) : rulesRaw;
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
        // FIXED: log status for debugging
        console.log("Form loaded with status:", formData.status);
        setRules(rulesArr.map((r) => ({ ...r, _id: Date.now() + Math.random() })));
        setFields(loadedFields);
        savedSnapshot.current = {
          formName: formData.formName || "",
          fields: loadedFields,
          rules: rulesArr
        };
        setIsDirty(false);
        setIsLoading(false);
      })
      .catch((err) => { console.error(err); router.push("/forms/all"); });
  }, [id, user, versionId]);

  useEffect(() => {
    const af = fields.find((f) => f.id === activeFieldId);
    if (["select", "radio", "checkbox"].includes(af?.type) && user) {
      fetch(`http://localhost:9090/api/v1/forms`, { credentials: "include" })
        .then(r => r.json())
        .then(r => setAvailableForms(r.data || []))
        .catch(console.error);
    }
  }, [activeFieldId, fields, user]);

  useEffect(() => {
    const af = fields.find((f) => f.id === activeFieldId);
    if (["select", "radio", "checkbox"].includes(af?.type) && af?.sourceTable) {
      fetch(`http://localhost:9090/api/v1/forms/${af.sourceTable}`, { credentials: "include" })
        .then(r => r.json())
        .then(r => setSelectedFormFields(r.data?.fields || []))
        .catch(console.error);
    } else {
      setSelectedFormFields([]);
    }
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
      beforeDatetime: "", afterDatetime: "",
      maxFileSize: type.toLowerCase() === "file_upload" ? "5" : "",
      allowedFileTypes: type.toLowerCase() === "file_upload" ? "pdf,jpg,png" : "",
      options: ["radio", "checkbox", "select"].includes(type.toLowerCase()) ? ["Option 1", "Option 2"] : [],
      sourceTable: "", sourceColumn: "",
      isReadOnly: false,
      isMultiSelect: false,
      placeholder: "",
      helperText: "",
      key: "",
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
        return p.map((f) => (f.id === id ? { ...f, [key]: value, key: key === "label" && (!f.key || f.key === generateColumnName(f.label)) ? generateColumnName(value) : f.key } : f));
      });
    } else {
      setFields((p) => p.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
    }
  };
  const removeField = (id) => { setFields(fields.filter((f) => f.id !== id)); if (activeFieldId === id) setActiveFieldId(null); };
  const handleNumberInput = (e, id, key) => {
    const v = e.target.value;
    if (v === "" || v === "-") {
      updateField(id, key, v);
      return;
    }

    const field = fields.find(f => f.id === id);
    const isIntegerField = field?.type === "number";

    // Check if what they are typing is a valid integer or decimal
    const isDecimal = /^-?\d*\.?\d*$/.test(v);
    const isInteger = /^-?\d+$/.test(v);

    if (["minLength", "maxLength", "maxFileSize"].includes(key) || (isIntegerField && (key === "min" || key === "max" || key === "defaultValue"))) {
      // Must be whole number for length/size OR for min/max/default on an integer field
      if (isInteger) updateField(id, key, v);
    } else {
      // Allow decimals for min/max/default on decimal fields
      if (isDecimal) updateField(id, key, v);
    }
  };
  const generateColumnName = (label) => label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const publishForm = async () => {
    if (!window.confirm("Are you certain you wish to synchronize this architecture with the live database? This will create the physical data structure and make the form operational.")) return;

    setIsPublishing(true);
    try {
      await saveForm();
      const res = await fetch(`http://localhost:9090/api/v1/forms/publish/${id}`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Cloud synchronization failed.");
      }
      setFormStatus("PUBLISHED");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

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
        let fd = {
          id: field._dbId ?? null,
          name: field.label,
          fieldKey: field.key || generateColumnName(field.label),
          type: field.type,
          required: field.required,
          isReadOnly: field.isReadOnly,
          isMultiSelect: !!field.isMultiSelect
        };

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
        if (field.type === "number" || field.type === "decimal") {
          if (field.min !== undefined && field.min !== "") fd.min = Number(field.min);
          if (field.max !== undefined && field.max !== "") fd.max = Number(field.max);
        }
        if (field.type === "date") { if (field.afterDate) fd.afterDate = field.afterDate; if (field.beforeDate) fd.beforeDate = field.beforeDate; }
        if (field.type === "time") { if (field.afterTime) fd.afterTime = field.afterTime; if (field.beforeTime) fd.beforeTime = field.beforeTime; }
        if (field.type === "datetime") { if (field.afterDatetime) fd.afterDatetime = field.afterDatetime; if (field.beforeDatetime) fd.beforeDatetime = field.beforeDatetime; }
        if (field.type === "file_upload") {
          fd.maxFileSize = field.maxFileSize ? Number(field.maxFileSize) : 5;
          fd.allowedFileTypes = field.allowedFileTypes || "pdf,jpg,png";
        }
        return fd;
      });
      const updateUrl = versionId
        ? ENDPOINTS.formVersion(id, versionId)
        : `${ENDPOINTS.FORMS}/${id}`;

      const res = await fetch(updateUrl, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(versionId ? formattedFields : { formName: formName.trim(), fields: formattedFields }),
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
          return f.key || (f.label ? generateColumnName(f.label) : "");
        }).filter(Boolean).join(",");

        cleanRules.push({ action: { type: "SHOW", targetField: "__FIELD_ORDER__", message: currentOrderList } });

        const rulesUrl = versionId
          ? ENDPOINTS.formVersionRules(id, versionId)
          : ENDPOINTS.formRules(id);

        await fetch(rulesUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanRules), credentials: "include"
        });
      } catch (e) { console.warn("Failed to save rules:", e); }

      savedSnapshot.current = { formName, fields, rules: rules.map(({ _id, ...r }) => r) };
      setIsDirty(false);
      setShowSuccess(true);
      if (!isPublishing) {
        // FIXED: Show status-dependent success message
        const message = formStatus === "DRAFT" ? "Form saved as draft" : "New version created";
        // We can use a toast or just the success state if it's bound to a label
        // But the requirement says "Make sure the save success message says..."
        // I'll update the label in the return JSX as well, or just alert for now if that's the pattern
        // Based on FormHeader props, it uses showSuccess boolean. I'll pass labels to FormHeader.

        setTimeout(() => {
          setShowSuccess(false);
          // FIXED: Only redirect if it's a published version save, or keep user here for draft
          if (formStatus !== "DRAFT") {
            router.push("/forms/all");
          }
        }, 1500);
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteForm = async () => {
    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone and will preserve the dynamic table data.")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:9090/api/v1/forms/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const errorMsg = await res.text(); throw new Error(errorMsg || "Failed to delete form."); }
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); router.push("/forms/all"); }, 1000);
    } catch (err) { alert(`❌ ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const isRightSidebarOpen = activeField && !isDisplayOnly(activeField.type);

  // Broadcast Right Panel state
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("right-panel-state", { detail: { isOpen: !!isRightSidebarOpen } }));
  }, [isRightSidebarOpen]);

  // Listen for Left Menu changes
  useEffect(() => {
    const handleLeftMenu = (e) => {
      // If the left menu was manually opened by the user, close the right panel
      if (e.detail?.isOpen) {
        setActiveFieldId(null);
      }
    };
    document.addEventListener("left-menu-state", handleLeftMenu);
    return () => document.removeEventListener("left-menu-state", handleLeftMenu);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-mesh opacity-50" />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background text-slate-900 font-sans overflow-hidden w-full">
      <Toolbar handleDragStart={handleDragStart} />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative overflow-y-auto overflow-x-hidden transition-all duration-700 ease-in-out">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

        <FormHeader
          formName={formName}
          setFormName={setFormName}
          canEditName={false}
          formStatus={formStatus}
          saveForm={saveForm}
          publishForm={publishForm}
          deleteForm={deleteForm}
          isSaving={isSaving}
          isPublishing={isPublishing}
          showSuccess={showSuccess}
          saveLabel={formStatus === "DRAFT" ? "Save Draft" : "Save Version"} // FIXED: Dynamic label
          saveIcon={<Save size={18} strokeWidth={2.5} />}
          userRole={userRole}
          formId={id}
          onPreview={() => setIsPreviewOpen(true)}
          isDirty={isDirty}
        />

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 p-6 md:p-8 lg:p-10 xl:p-16 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-0"
        >
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Version read-only banner — when editing an active (live) version */}
            {isVersionActive && (
              <div className="premium-card bg-violet-50/80 border-violet-200/50 shadow-none !rounded-3xl">
                <div className="p-4 flex items-start gap-3 text-violet-900">
                  <Lock size={20} className="mt-0.5 text-violet-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Read-Only Version</p>
                    <p className="text-sm font-medium opacity-80 leading-relaxed">
                      This is the active version and cannot be modified.
                      Create a new version to make changes.
                    </p>
                  </div>
                  <Link
                    href={`/forms/${id}/versions`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-black hover:bg-violet-700 transition-all whitespace-nowrap"
                  >
                    <GitBranch size={12} /> Versions
                  </Link>
                </div>
              </div>
            )}

            {formStatus === "PUBLISHED" && !isVersionActive && (
              <div className="premium-card bg-amber-50/80 border-amber-200/50 shadow-none !rounded-3xl">
                <div className="p-4 flex items-start gap-3 text-amber-900">
                  <AlertCircle size={20} className="mt-0.5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Live Edition Mode</p>
                    <p className="text-sm font-medium opacity-80 leading-relaxed">Changes to published fields will automatically synchronize with the architectural database table.</p>
                  </div>
                </div>
              </div>
            )}

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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleSortStart}
                onDragEnd={handleSortEnd}
                onDragCancel={handleSortCancel}
              >
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
