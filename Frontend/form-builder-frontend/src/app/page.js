"use client";

import { useState } from "react";
import { 
  Type, 
  Hash, 
  Mail, 
  Calendar, 
  Plus, 
  Trash2, 
  Settings2, 
  GripVertical,
  Rocket
} from "lucide-react";

export default function BuilderPage() {
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);

  const fieldIcons = {
    text: <Type size={18} />,
    number: <Hash size={18} />,
    email: <Mail size={18} />,
    date: <Calendar size={18} />,
  };

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData("fieldType", type);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("fieldType");
    if (!type) return;

    setFields([
      ...fields,
      {
        id: Date.now(),
        label: "",
        type: type.toLowerCase(),
        required: false,
        minLength: "",
        maxLength: "",
        min: "",
        max: "",
      },
    ]);
  };

  const handleDragOver = (e) => e.preventDefault();

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleNumberInput = (e, id, key) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      updateField(id, key, value);
    }
  };

  const generateColumnName = (label) => {
    return label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  const saveForm = async () => {
  // 1. Validation
  if (!formName.trim()) return alert("Please name your form before publishing.");
  if (fields.length === 0) return alert("Add at least one field.");

  try {
    // 2. Transform the fields into the format the Backend expects
    const formattedFields = fields.map((field) => {
      if (!field.label) throw new Error("All fields must have a label");

      let fieldData = {
        name: generateColumnName(field.label),
        type: field.type,
        required: field.required,
      };

      // Handle Text/Textarea validation
      if (field.type === "text" || field.type === "textarea") {
        if (field.minLength) fieldData.minLength = Number(field.minLength);
        if (field.maxLength) fieldData.maxLength = Number(field.maxLength);
      }

      // Handle Number validation
      if (field.type === "number") {
        if (field.min) fieldData.min = Number(field.min);
        if (field.max) fieldData.max = Number(field.max);
      }

      // Handle Email pattern
      if (field.type === "email") {
        fieldData.pattern = "";
      }

      return fieldData;
    });

    // 3. DEFINE THE PAYLOAD (This was the missing piece!)
    const payload = {
      formName: formName.trim(),
      fields: formattedFields,
    };

    // 4. Send to API
    const response = await fetch("http://localhost:9090/api/forms", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(payload),
    });

    // 5. Handle non-JSON responses (Prevents the "Unexpected token" error)
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || "Server error occurred");
    }

    alert(`✅ Success: ${data.message}`);
    
    // Reset form after success
    setFormName("");
    setFields([]);

  } catch (err) {
    console.error("Save Error:", err);
    alert(`❌ ${err.message}`);
  }
};

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus size={20} className="text-indigo-600" /> Form Elements
          </h2>
          <p className="text-sm text-slate-500 mt-1">Drag and drop to build</p>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {Object.keys(fieldIcons).map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="group flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-indigo-400 hover:shadow-md transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {fieldIcons[type]}
                </div>
                <span className="text-sm font-medium capitalize">{type} Field</span>
              </div>
              <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              placeholder="Untitled Form Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none transition-all px-1 py-1 w-full max-w-md"
            />
          </div>
          <button
            onClick={saveForm}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Rocket size={18} />
            Publish Form
          </button>
        </header>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 p-10 overflow-auto scrollbar-hide"
        >
          {fields.length === 0 ? (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Plus size={32} />
              </div>
              <p className="text-lg font-medium">Your canvas is empty</p>
              <p className="text-sm">Drag components here to start building</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Field Header / Handle */}
                  <div className="h-1 w-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <input
                          placeholder="Untitled Question"
                          value={field.label}
                          onChange={(e) => updateField(field.id, "label", e.target.value)}
                          className="w-full text-lg font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => removeField(field.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-end">
                      {/* Configuration */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group/check">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, "required", e.target.checked)}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                            />
                            <Plus size={12} className="absolute left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <span className="text-sm font-medium text-slate-600">Required Field</span>
                        </label>
                      </div>

                      {/* Dynamic Validation Inputs */}
                      <div className="flex gap-2">
                        {field.type === "text" && (
                          <>
                            <input
                              type="number"
                              placeholder="Min Char"
                              value={field.minLength}
                              onChange={(e) => handleNumberInput(e, field.id, "minLength")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Max Char"
                              value={field.maxLength}
                              onChange={(e) => handleNumberInput(e, field.id, "maxLength")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            />
                          </>
                        )}
                        {field.type === "number" && (
                          <>
                            <input
                              type="number"
                              placeholder="Min Value"
                              value={field.min}
                              onChange={(e) => handleNumberInput(e, field.id, "min")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Max Value"
                              value={field.max}
                              onChange={(e) => handleNumberInput(e, field.id, "max")}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Settings2 size={12} /> {field.type} Field Config
                    </span>
                    <span className="text-[10px] text-slate-400 italic">ID: {field.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}