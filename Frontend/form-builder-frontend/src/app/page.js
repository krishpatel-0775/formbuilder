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
  Type,
  Hash,
  Mail,
  Calendar,
  Trash2,
  Settings2,
  GripVertical,
  Rocket,
  X,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ListPlus,
  ArrowRight,
  AlignLeft,
  CircleDot,
  CheckSquare,
} from "lucide-react";

// --- Sortable Field Wrapper Component ---
function SortableFieldItem({ field, idx, isActive, activeFieldId, setActiveFieldId, removeField, updateField, fieldIcons }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setActiveFieldId(field.id)}
      className={`group relative flex items-center p-5 gap-5 bg-white rounded-[1.5rem] border shadow-sm transition-all duration-300 cursor-pointer ${
        isActive
          ? "border-blue-400 shadow-[0_8px_30px_rgba(59,130,246,0.12)] ring-1 ring-blue-400"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-800"
      }`}
    >
      {/* Index / Reorder handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="flex flex-col items-center justify-center w-8 cursor-grab active:cursor-grabbing hover:bg-slate-50 p-1 rounded-lg transition-colors"
      >
        <span className="text-[10px] font-black text-slate-400 mb-1 pointer-events-none">{idx + 1}</span>
        <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors pointer-events-none" />
      </div>

      <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">
        {fieldIcons[field.type]}
      </div>
      
      <div className="flex-1">
        <input
          placeholder="Enter question title..."
          value={field.label}
          onChange={(e) => updateField(field.id, "label", e.target.value)}
          className="w-full text-base font-bold text-slate-900 bg-transparent outline-none placeholder:font-medium placeholder:text-slate-400"
          onClick={(e) => e.stopPropagation()}
        />
        {field.required && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 inline-block">* REQUIRED</span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
        className={`opacity-0 group-hover:opacity-100 flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 ${isDragging ? 'hidden' : ''}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}


export default function BuilderPage() {
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sorting state
  const [activeSortId, setActiveSortId] = useState(null);

  const fieldIcons = {
    text: <Type size={18} />,
    textarea: <AlignLeft size={18} />,
    number: <Hash size={18} />,
    email: <Mail size={18} />,
    date: <Calendar size={18} />,
    radio: <CircleDot size={18} />,
    checkbox: <CheckSquare size={18} />,
    select: <ListPlus size={18} />,
  };

  const activeField = useMemo(
    () => fields.find((f) => f.id === activeFieldId),
    [fields, activeFieldId],
  );

  const activeSortField = useMemo(
    () => fields.find((f) => f.id === activeSortId),
    [fields, activeSortId]
  );

  const [availableForms, setAvailableForms] = useState([]);
  const [selectedFormFields, setSelectedFormFields] = useState([]);

  // Fetch all available forms
  useEffect(() => {
    if (activeField && activeField.type === "select") {
      fetch("http://localhost:9090/api/forms")
        .then(res => res.json())
        .then(data => setAvailableForms(data))
        .catch(err => console.error(err));
    }
  }, [activeField?.id, activeField?.type]);

  // Fetch the fields of the specific form chosen for the dynamic dropdown
  useEffect(() => {
    if (activeField && activeField.type === "select" && activeField.sourceTable) {
        fetch(`http://localhost:9090/api/forms/${activeField.sourceTable}`)
            .then(res => res.json())
            .then(data => setSelectedFormFields(data.fields || []))
            .catch(console.error);
    } else {
        setSelectedFormFields([]);
    }
  }, [activeField?.sourceTable, activeField?.id, activeField?.type]);

  // --- DND Kits Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before dragging (helps separate click to edit vs drag)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData("fieldType", type);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("fieldType");
    if (!type) return;

    const newField = {
      id: Date.now(),
      label: "",
      type: type.toLowerCase(),
      required: false,
      minLength: "",
      maxLength: "",
      min: "",
      max: "",
      pattern: "",
      beforeDate: "",
      afterDate: "",
      options: (type.toLowerCase() === "radio" || type.toLowerCase() === "checkbox" || type.toLowerCase() === "select") ? ["Option 1", "Option 2"] : [],
      sourceTable: "",
      sourceColumn: "",
    };

    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const handleDragOver = (e) => e.preventDefault();

  // --- Sortable Handlers ---
  const handleSortStart = (event) => {
    const { active } = event;
    setActiveSortId(active.id);
  };

  const handleSortEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveSortId(null);
  };

  const handleSortCancel = () => {
    setActiveSortId(null);
  };

  const updateField = (id, key, value) => {
    setFields((prevFields) => prevFields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  };

  const handleNumberInput = (e, id, key) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      updateField(id, key, value);
    }
  };

  const generateColumnName = (label) => {
    return label
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  const saveForm = async () => {
    if (!formName.trim()) return alert("Please name your form.");
    if (fields.length === 0) return alert("Add at least one field.");

    setIsPublishing(true);
    try {
      const formattedFields = fields.map((field) => {
        if (!field.label) throw new Error(`Field label is required`);

        let fieldData = {
          name: generateColumnName(field.label),
          type: field.type,
          required: field.required,
        };

        if (field.type === "radio" || field.type === "checkbox" || field.type === "select") {
          fieldData.options = field.options;
        }

        if (field.type === "select") {
          if (field.sourceTable) fieldData.sourceTable = field.sourceTable;
          if (field.sourceColumn) fieldData.sourceColumn = field.sourceColumn;
        }

        if (field.type === "text" || field.type === "textarea") {
          if (field.minLength) fieldData.minLength = Number(field.minLength);
          if (field.maxLength) fieldData.maxLength = Number(field.maxLength);
          if (field.type === "text" && field.pattern) fieldData.pattern = field.pattern;
        }

        if (field.type === "number") {
          if (field.min) fieldData.min = Number(field.min);
          if (field.max) fieldData.max = Number(field.max);
        }

        if (field.type === "email" && field.pattern) {
          fieldData.pattern = field.pattern;
        }

        if (field.type === "date") {
          if (field.afterDate) fieldData.afterDate = field.afterDate;
          if (field.beforeDate) fieldData.beforeDate = field.beforeDate;
        }

        return fieldData;
      });

      const response = await fetch("http://localhost:9090/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: formName.trim(),
          fields: formattedFields,
        }),
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Failed to save form.");
      }

      const text = await response.text();
      
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
      {/* LEFT SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <ListPlus className="text-blue-600" size={20} />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
              Components
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide">Drag & drop to build</p>
        </div>
        
        <div className="p-6 space-y-3 overflow-y-auto">
          {Object.keys(fieldIcons).map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-grab hover:bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all group hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 text-slate-400 transition-all duration-300">
                {fieldIcons[type]}
              </div>
              <div>
                <span className="text-sm font-bold capitalize text-slate-700 group-hover:text-slate-900 transition-colors">{type}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Custom input field</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* CENTER: CANVAS */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-20 border-b border-slate-200 px-8 flex items-center justify-between z-10 backdrop-blur-xl bg-white/80">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Enter Form Title..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-2xl font-black bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-slate-400 text-slate-900 tracking-tight"
            />
            <div className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-0 transition-opacity focus-within:opacity-100" />
          </div>

          <button
            onClick={saveForm}
            disabled={isPublishing || showSuccess}
            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md ${
              showSuccess 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-slate-900 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20"
            }`}
          >
            {showSuccess ? (
              <><CheckCircle2 size={16} /> PUBLISHED</>
            ) : isPublishing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><Rocket size={16} /> Draft Form </>
            )}
          </button>
        </header>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 p-10 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] relative z-0"
        >
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
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleSortStart}
                onDragEnd={handleSortEnd}
                onDragCancel={handleSortCancel}
              >
                <SortableContext 
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field, idx) => (
                    <SortableFieldItem 
                      key={field.id}
                      field={field}
                      idx={idx}
                      isActive={activeFieldId === field.id}
                      activeFieldId={activeFieldId}
                      setActiveFieldId={setActiveFieldId}
                      removeField={removeField}
                      updateField={updateField}
                      fieldIcons={fieldIcons}
                    />
                  ))}
                </SortableContext>
                
                <DragOverlay>
                  {activeSortField ? (
                    <div className="group relative flex items-center p-5 gap-5 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-blue-400 shadow-[0_15px_40px_rgba(59,130,246,0.2)] ring-2 ring-blue-400/50 cursor-grabbing rotate-2 scale-[1.02] transition-transform">
                      <div className="flex flex-col items-center justify-center w-8">
                        <GripVertical size={16} className="text-blue-500" />
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shadow-inner">
                        {fieldIcons[activeSortField.type]}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-bold text-slate-900 w-full inline-block">
                          {activeSortField.label || "Enter question title..."}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: PROPERTIES */}
      <aside
        className={`w-80 bg-white border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] absolute right-0 h-full z-30 flex flex-col ${
          activeFieldId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {activeField && (
          <>
            <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50/50 to-transparent">
              <div>
                <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">
                  Properties
                </h2>
                <p className="text-lg font-bold text-slate-900 capitalize">
                  {activeField.type} Settings
                </p>
              </div>
              <button
                onClick={() => setActiveFieldId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
              {/* Validation: Required */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Field Behavior
                </label>
                <div
                  onClick={() => updateField(activeField.id, "required", !activeField.required)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                    activeField.required 
                    ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm font-bold">
                    Required Field
                  </span>
                  <div className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${activeField.required ? "bg-blue-600" : "bg-slate-300"}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${activeField.required ? "translate-x-6" : "translate-x-1"}`} />
                  </div>
                </div>
              </div>

              {/* Dynamic Validations based on type */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} /> Constraints
                </label>

                {(activeField.type === "text" || activeField.type === "textarea") && (
                  <div className="flex flex-col gap-6">
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                        Character Range
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Min</span>
                          <input
                            type="number"
                            value={activeField.minLength}
                            onChange={(e) => handleNumberInput(e, activeField.id, "minLength")}
                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-transparent shadow-sm"
                            placeholder="0"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                          <input
                            type="number"
                            value={activeField.maxLength}
                            onChange={(e) => handleNumberInput(e, activeField.id, "maxLength")}
                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-transparent shadow-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    {activeField.type === "text" && (
                      <div className="space-y-3">
                        <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                          Regex Pattern
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. ^[A-Z]+$"
                          value={activeField.pattern}
                          onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                          className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-blue-600 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {(activeField.type === "radio" || activeField.type === "checkbox" || activeField.type === "select") && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                        {activeField.type === 'select' ? 'Data Source Options' : 'Choices'}
                      </span>
                    </div>

                    {activeField.type === "select" && (
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button 
                          onClick={() => {
                            updateField(activeField.id, "sourceTable", "");
                            updateField(activeField.id, "sourceColumn", "");
                          }}
                          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-colors ${!activeField.sourceTable ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Manual List
                        </button>
                        <button 
                          onClick={() => {
                            if (!activeField.sourceTable && availableForms.length > 0) {
                              updateField(activeField.id, "sourceTable", availableForms[0].id.toString());
                            }
                          }}
                          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-colors ${activeField.sourceTable ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                          Other Form Data
                        </button>
                      </div>
                    )}

                    {!activeField.sourceTable ? (
                      <div className="space-y-3 mt-2">
                        {activeField.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                             <input 
                               type="text" 
                               value={opt} 
                               onChange={(e) => {
                                 const newOptions = [...activeField.options];
                                 newOptions[i] = e.target.value;
                                 updateField(activeField.id, "options", newOptions);
                               }}
                               className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                             />
                             <button 
                               onClick={() => {
                                 const newOptions = activeField.options.filter((_, idx) => idx !== i);
                                 updateField(activeField.id, "options", newOptions);
                               }} 
                               className="p-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateField(activeField.id, "options", [...(activeField.options || []), `Option ${(activeField.options?.length || 0) + 1}`])} 
                          className="w-full p-3 border border-dashed border-blue-300 rounded-xl text-blue-600 font-bold hover:bg-blue-50 text-sm transition-colors mt-2"
                        >
                          + Add Choice
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-2">
                         <div className="flex flex-col space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400">Source Form</label>
                            <select 
                               value={activeField.sourceTable || ""}
                               onChange={(e) => {
                                  updateField(activeField.id, "sourceTable", e.target.value);
                                  updateField(activeField.id, "sourceColumn", "");
                               }}
                               className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                            >
                               <option value="" disabled>Select a form...</option>
                               {availableForms.map(form => (
                                  <option key={form.id} value={form.id.toString()}>{form.formName}</option>
                               ))}
                            </select>
                         </div>
                         <div className="flex flex-col space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-400">Data Column (Target)</label>
                             <select 
                                value={activeField.sourceColumn || ""}
                                onChange={(e) => updateField(activeField.id, "sourceColumn", e.target.value)}
                                className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                                disabled={!activeField.sourceTable}
                             >
                                <option value="" disabled>Select a column to use...</option>
                                {selectedFormFields.map(f => (
                                   <option key={f.fieldName} value={f.fieldName}>{f.fieldName} ({f.fieldType})</option>
                                ))}
                             </select>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                {activeField.type === "number" && (
                  <div className="flex flex-col gap-6">
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                        Value Range
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Min</span>
                          <input
                            type="number"
                            value={activeField.min}
                            onChange={(e) => handleNumberInput(e, activeField.id, "min")}
                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-transparent shadow-sm"
                            placeholder="0"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                          <input
                            type="number"
                            value={activeField.max}
                            onChange={(e) => handleNumberInput(e, activeField.id, "max")}
                            className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-transparent shadow-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeField.type === "email" && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                      Validation Regex
                    </span>
                    <input
                      type="text"
                      placeholder="Custom pattern..."
                      value={activeField.pattern}
                      onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                      className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-blue-600 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                )}

                {activeField.type === "date" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                        Date Range Limitations
                      </span>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">After Date</span>
                          <input
                            type="date"
                            value={activeField.afterDate}
                            onChange={(e) => updateField(activeField.id, "afterDate", e.target.value)}
                            className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Date</span>
                          <input
                            type="date"
                            value={activeField.beforeDate}
                            onChange={(e) => updateField(activeField.id, "beforeDate", e.target.value)}
                            className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-center gap-2 text-slate-500 bg-white border border-slate-100 py-3 rounded-xl shadow-sm">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Settings are auto-saved
                </span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

