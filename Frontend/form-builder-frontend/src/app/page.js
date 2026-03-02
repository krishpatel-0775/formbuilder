"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

export default function BuilderPage() {
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState(null);

  const fieldIcons = {
    text: <Type size={16} />,
    number: <Hash size={16} />,
    email: <Mail size={16} />,
    date: <Calendar size={16} />,
  };

  const activeField = useMemo(
    () => fields.find((f) => f.id === activeFieldId),
    [fields, activeFieldId],
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
    };

    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const handleDragOver = (e) => e.preventDefault();

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
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

    try {
      const formattedFields = fields.map((field) => {
        if (!field.label) throw new Error(`Field label is required`);

        let fieldData = {
          name: generateColumnName(field.label),
          type: field.type,
          required: field.required,
        };

        // TEXT
        if (field.type === "text") {
          if (field.minLength)
            fieldData.minLength = Number(field.minLength);
          if (field.maxLength)
            fieldData.maxLength = Number(field.maxLength);
          if (field.pattern)
            fieldData.pattern = field.pattern;
        }

        // NUMBER
        if (field.type === "number") {
          if (field.min)
            fieldData.min = Number(field.min);
          if (field.max)
            fieldData.max = Number(field.max);
        }

        // EMAIL
        if (field.type === "email" && field.pattern) {
          fieldData.pattern = field.pattern;
        }

        // ✅ DATE (FIXED POSITION)
        if (field.type === "date") {
          if (field.afterDate)
            fieldData.afterDate = field.afterDate;
          if (field.beforeDate)
            fieldData.beforeDate = field.beforeDate;
        }

        return fieldData; // ✅ now return is last
      });

      const response = await fetch("http://localhost:9090/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: formName.trim(),
          fields: formattedFields,
        }),
      });

      const text = await response.text();
      alert(`✅ ${text}`);
      setFormName("");
      setFields([]);
      setActiveFieldId(null);
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* --- LEFT SIDEBAR: TOOLBOX --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            Components
          </h2>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {Object.keys(fieldIcons).map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-grab hover:border-indigo-500 hover:shadow-sm transition-all group"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                {fieldIcons[type]}
              </div>
              <span className="text-sm font-bold capitalize">{type}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* --- CENTER: CANVAS --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9] relative overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
          <input
            type="text"
            placeholder="Untitled Form"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="text-lg font-black bg-transparent border-none focus:ring-0 w-full max-w-md placeholder:text-slate-300 uppercase tracking-tight"
          />
          <button
            onClick={saveForm}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-indigo-600 transition-all active:scale-95"
          >
            <Rocket size={14} /> PUBLISH
          </button>
        </header>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 p-10 overflow-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]"
        >
          <div className="max-w-3xl mx-auto space-y-3">
            {fields.length === 0 && (
              <div className="h-32 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center text-slate-400 uppercase text-[10px] font-black tracking-widest bg-white/50">
                Drop fields here
              </div>
            )}
            {fields.map((field) => (
              <div
                key={field.id}
                onClick={() => setActiveFieldId(field.id)}
                className={`group flex items-center p-4 gap-4 bg-white rounded-2xl border-2 transition-all cursor-pointer ${
                  activeFieldId === field.id
                    ? "border-indigo-500 shadow-lg ring-4 ring-indigo-500/5"
                    : "border-transparent hover:border-slate-200"
                }`}
              >
                <GripVertical size={16} className="text-slate-300" />
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 text-indigo-600 rounded-xl border border-slate-100">
                  {fieldIcons[field.type]}
                </div>
                <div className="flex-1">
                  <input
                    placeholder="Enter question title..."
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, "label", e.target.value)
                    }
                    className="w-full text-sm font-bold text-slate-800 bg-transparent focus:outline-none placeholder:font-normal placeholder:text-slate-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(field.id);
                  }}
                  className="text-slate-200 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* --- RIGHT SIDEBAR: PROPERTIES --- */}
      <aside
        className={`w-80 bg-white border-l border-slate-200 transition-all duration-300 transform ${activeFieldId ? "translate-x-0" : "translate-x-full absolute right-0"}`}
      >
        {activeField ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                  Properties
                </h2>
                <p className="text-xs font-bold text-slate-900 capitalize">
                  {activeField.type} Settings
                </p>
              </div>
              <button
                onClick={() => setActiveFieldId(null)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              {/* Validation: Required */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Field Behavior
                </label>
                <div
                  onClick={() =>
                    updateField(
                      activeField.id,
                      "required",
                      !activeField.required,
                    )
                  }
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-700">
                    Required Field
                  </span>
                  <div
                    className={`w-8 h-4 rounded-full transition-colors relative ${activeField.required ? "bg-indigo-600" : "bg-slate-300"}`}
                  >
                    <div
                      className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-transform ${activeField.required ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Validations based on type */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={12} /> Constraints
                </label>

                {activeField.type === "text" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Character Range
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={activeField.minLength}
                          onChange={(e) =>
                            handleNumberInput(e, activeField.id, "minLength")
                          }
                          className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={activeField.maxLength}
                          onChange={(e) =>
                            handleNumberInput(e, activeField.id, "maxLength")
                          }
                          className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Regex Pattern
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. ^[A-Z]+$"
                        value={activeField.pattern}
                        onChange={(e) =>
                          updateField(activeField.id, "pattern", e.target.value)
                        }
                        className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>
                )}

                {activeField.type === "number" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Value Range
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={activeField.min}
                          onChange={(e) =>
                            handleNumberInput(e, activeField.id, "min")
                          }
                          className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={activeField.max}
                          onChange={(e) =>
                            handleNumberInput(e, activeField.id, "max")
                          }
                          className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeField.type === "email" && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600">
                      Validation Regex
                    </span>
                    <input
                      type="text"
                      placeholder="Custom email pattern..."
                      value={activeField.pattern}
                      onChange={(e) =>
                        updateField(activeField.id, "pattern", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                )}

                {activeField.type === "date" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Date Range
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={activeField.afterDate}
                          onChange={(e) =>
                            updateField(
                              activeField.id,
                              "afterDate",
                              e.target.value,
                            )
                          }
                          className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        />
                        <input
                          type="date"
                          value={activeField.beforeDate}
                          onChange={(e) =>
                            updateField(
                              activeField.id,
                              "beforeDate",
                              e.target.value,
                            )
                          }
                          className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Left = After Date (Min), Right = Before Date (Max)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Settings synced
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <Settings2 className="w-10 h-10 text-slate-100 mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Select a field
              <br />
              to edit properties
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
