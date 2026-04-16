"use client";

import { useState, useEffect } from "react";
import { X, Smartphone, Monitor, Send, CheckCircle2 } from "lucide-react";
import { FormFieldWrapper } from "./FormFieldWrapper";

/** Evaluates a flat calculation formula against current formData. Returns null on error/div-by-zero. */
function computeFormula(formulaJson, formData) {
  if (!formulaJson) return null;
  try {
    const { operator, operands } = JSON.parse(formulaJson);
    if (!operands || operands.length === 0) return null;

    const resolve = (key) => {
      const val = formData[key];
      if (val === undefined || val === null || val === "") return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    let acc = resolve(operands[0]);
    for (let i = 1; i < operands.length; i++) {
      const val = resolve(operands[i]);
      if (operator === "+") acc += val;
      else if (operator === "-") acc -= val;
      else if (operator === "*") acc *= val;
      else if (operator === "/") {
        if (val === 0) return null;
        acc /= val;
      }
    }
    return acc;
  } catch (e) { return null; }
}

export function FormPreview({ isOpen, onClose, fields, formName }) {
  const [viewMode, setViewMode] = useState("desktop"); // "desktop" | "mobile"
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Real-time calculation for preview mode
  useEffect(() => {
    if (!fields) return;
    const calculated = fields.filter((f) => f.isCalculated && f.calculationFormula);
    if (calculated.length === 0) return;
    setFormData((prev) => {
      let updated = { ...prev };
      let changed = false;
      for (const f of calculated) {
        const key = f.fieldKey || f.label || f.type;
        const formula = f.calculationFormula;
        // Map preview field keys: preview uses field.label as the key in formData
        const previewData = {};
        Object.entries(prev).forEach(([k, v]) => { previewData[k] = v; });
        const result = computeFormula(formula, previewData);
        let newVal = "";
        if (result !== null) {
          if (f.type === "number") {
             newVal = String(Math.trunc(result));
          } else {
             newVal = String(result);
          }
        }
        if (updated[key] !== newVal) { updated[key] = newVal; changed = true; }
      }
      return changed ? updated : prev;
    });
  }, [formData, fields]);

  if (!isOpen) return null;

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCheckboxChange = (fieldName, optionValue) => {
    const current = Array.isArray(formData[fieldName]) ? formData[fieldName] : [];
    const updated = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    handleInputChange(fieldName, updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({});
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full h-full flex flex-col items-center p-4 md:p-8">
        {/* Header / Controls */}
        <div className="w-full max-w-5xl flex items-center justify-between mb-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary font-black text-xs uppercase tracking-widest px-4">
              Preview Mode
            </div>
            <h2 className="text-sm font-black text-slate-700 truncate max-w-[200px] md:max-w-md">
              {formName || "Untitled Form"}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`p-2 rounded-lg transition-all ${viewMode === "desktop" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              title="Desktop View"
            >
              <Monitor size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`p-2 rounded-lg transition-all ${viewMode === "mobile" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              title="Mobile View"
            >
              <Smartphone size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
            title="Close Preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Area */}
        <div 
          className={`flex-1 w-full flex justify-center transition-all duration-500 overflow-hidden ${
            viewMode === "mobile" ? "max-w-[400px]" : "max-w-5xl"
          }`}
        >
          <div className="w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
            {viewMode === "mobile" && (
              <div className="h-6 w-full bg-slate-50 flex items-center justify-center border-b border-slate-100">
                <div className="w-16 h-1 rounded-full bg-slate-200" />
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Success Simulation Complete</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No data was actually saved in preview mode</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-primary/20"
                  >
                    Reset Form
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{formName || "Untitled Form"}</h1>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed">This is a dynamic preview of your form architecture. All interactions are simulated.</p>
                  </div>

                  <div className="space-y-10">
                    {fields.map((field) => (
                      <FormFieldWrapper
                        key={field.id}
                        field={{
                          ...field,
                          fieldName: field.label || field.type, 
                          fieldType: field.type 
                        }}
                        value={formData[field.label || field.type]}
                        onChange={handleInputChange}
                        onCheckboxChange={handleCheckboxChange}
                        errors={[]}
                        visibility="SHOW"
                      />
                    ))}
                  </div>

                  <div className="pt-8">
                    <button
                      type="submit"
                      className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                      <Send size={18} />
                      Simulate Submission
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            {viewMode === "mobile" && (
              <div className="h-4 w-full bg-slate-50 border-t border-slate-100" />
            )}
          </div>
        </div>

        {/* Footer Hint */}
        <p className="mt-6 text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
          Interactive Simulation Engine • Antigravity V1.0
        </p>
      </div>
    </div>
  );
}
