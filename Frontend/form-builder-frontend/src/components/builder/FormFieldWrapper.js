"use client";

import { AlertCircle, CheckCircle2, Star, Zap, ChevronRight } from "lucide-react";

export function FormFieldWrapper({ 
  field, 
  value, 
  onChange, 
  errors = [], 
  visibility = "SHOW", 
  isShowControlled = false, 
  isRuleRequired = false,
  onCheckboxChange
}) {
  if (visibility === "HIDE") return null;
  if (isShowControlled && visibility !== "SHOW") return null;

  const hasError = errors && errors.length > 0;
  const inputBase = "w-full px-6 py-5 rounded-[1.5rem] border transition-all duration-500 outline-none font-bold text-[15px] shadow-sm";
  const inputCls = `${inputBase} ${hasError
    ? "border-red-200 bg-red-50/20 text-red-900 placeholder:text-red-200 focus:border-red-400 focus:ring-8 focus:ring-red-50"
    : "border-slate-100 bg-slate-50/50 text-slate-800 placeholder:text-slate-200 focus:bg-white focus:border-primary focus:ring-8 focus:ring-primary/5 hover:border-slate-200"
    }`;

  // ── Static elements: render and return early (no label/input/errors) ──
  if (field.fieldType === "heading") {
    return (
      <div className="pt-8 pb-4">
        <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
          {field.defaultValue || field.fieldName}
        </h2>
        <div className="w-12 h-1.5 bg-primary rounded-full mt-4" />
      </div>
    );
  }
  if (field.fieldType === "paragraph") {
    return (
      <p className="text-[15px] text-slate-500 leading-relaxed font-medium bg-slate-50/30 p-6 rounded-[2rem] border border-slate-100/50 italic">
        {field.defaultValue || field.fieldName}
      </p>
    );
  }
  if (field.fieldType === "divider") {
    return (
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center">
            <div className="bg-[#f8fafc] px-4">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div id={`field-${field.fieldName}`} className="space-y-4 group animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Label Area */}
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <span>{field.fieldName}</span>
            {(field.required || isRuleRequired) && <span className="text-red-500 text-lg leading-none mt-1">*</span>}
        </label>
        <div className="flex gap-2">
            {visibility === "SHOW" && isShowControlled && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <Zap size={10} strokeWidth={3} /> Logic Reveal
                </div>
            )}
            {isRuleRequired && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <Star size={10} fill="currentColor" /> Mandatory
                </div>
            )}
        </div>
      </div>

      {/* TEXTAREA */}
      {field.fieldType === "textarea" && (
        <textarea 
          rows={5} 
          value={value || ""}
          onChange={(e) => onChange(field.fieldName, e.target.value)}
          placeholder={`Enter your ${field.fieldName.toLowerCase()} details...`}
          className={`${inputCls} resize-none leading-relaxed`} 
        />
      )}

      {/* RADIO */}
      {field.fieldType === "radio" && (
        <div className="grid gap-3">
          {field.options?.map((opt, idx) => {
            const isObj = typeof opt === "object" && opt !== null;
            const optVal = isObj ? opt.id : opt;
            const optLabel = isObj ? opt.value : opt;
            // Use loose equality to handle string vs number (e.g. "1" == 1)
            const isActive = value == optVal;
            
            return (
              <label key={idx} className={`flex items-center justify-between p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 ${
                  isActive
                  ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 text-primary"
                  : hasError 
                    ? "bg-red-50/20 border-red-100 text-slate-500"
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive ? "border-primary bg-primary" : "border-slate-200 bg-white"
                    }`}>
                        {isActive && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-300" />}
                    </div>
                    <span className="font-black text-[15px]">{optLabel}</span>
                </div>
                {isActive && <CheckCircle2 size={18} strokeWidth={3} className="animate-in slide-in-from-right-2 fade-in" />}
                <input type="radio" name={field.fieldName} value={optVal} checked={isActive}
                    onChange={() => onChange(field.fieldName, optVal)}
                    className="hidden" />
              </label>
            );
          })}
        </div>
      )}

      {/* CHECKBOX */}
      {field.fieldType === "checkbox" && (
        <div className="grid gap-3">
          {field.options?.map((opt, idx) => {
            const isObj = typeof opt === "object" && opt !== null;
            const optVal = isObj ? opt.id : opt;
            const optLabel = isObj ? opt.value : opt;
            
            // Handle both array and comma-separated string states
            const currentVals = Array.isArray(value) 
                ? value 
                : (value || "").toString().split(",").map(v => v.trim()).filter(Boolean);
            const isActive = currentVals.some(v => v == optVal);

            return (
              <label key={idx} className={`flex items-center justify-between p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 ${
                  isActive
                  ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 text-primary"
                  : hasError 
                    ? "bg-red-50/30 border-red-100 text-slate-500"
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isActive ? "border-primary bg-primary" : "border-slate-200 bg-white"
                    }`}>
                        {isActive && <CheckCircle2 size={14} strokeWidth={4} className="text-white animate-in zoom-in duration-300" />}
                    </div>
                    <span className="font-black text-[15px]">{optLabel}</span>
                </div>
                <input type="checkbox" checked={isActive}
                    onChange={() => onCheckboxChange(field.fieldName, optVal)}
                    className="hidden" />
              </label>
            );
          })}
        </div>
      )}

      {/* SELECT */}
      {field.fieldType === "select" && (
        <div className="relative group/select">
          <select value={value || ""}
            onChange={(e) => onChange(field.fieldName, e.target.value)}
            className={`${inputCls} appearance-none cursor-pointer pr-16`}>
            <option value="" disabled>Choose an architectural option...</option>
            {field.options?.map((opt, idx) => {
              const isObj = typeof opt === "object" && opt !== null;
              const val = isObj ? opt.id : opt;
              const label = isObj ? opt.value : opt;
              return <option key={idx} value={val}>{label}</option>;
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-slate-300 group-hover/select:text-primary transition-colors">
            <ChevronRight size={24} className="rotate-90" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* TOGGLE */}
      {field.fieldType === "toggle" && (() => {
        const isOn = (value ?? field.defaultValue) === "true";
        return (
          <div
            onClick={() => onChange(field.fieldName, isOn ? "false" : "true")}
            className={`flex items-center justify-between p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-700 select-none ${
              isOn
                ? "bg-emerald-50 border-emerald-300 shadow-xl shadow-emerald-500/5 text-emerald-900"
                : hasError
                  ? "bg-red-50/30 border-red-200 text-red-900"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
            }`}>
            <span className="font-black text-[15px] uppercase tracking-widest pl-2">
              {isOn ? "Operational: Active" : "Operational: Standby"}
            </span>
            <div className={`relative w-16 h-8 rounded-full transition-all duration-500 ${
              isOn ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-slate-200"
            }`}>
              <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 ${
                isOn ? "translate-x-9 scale-110" : "translate-x-1.5"
              }`} />
            </div>
          </div>
        );
      })()}

      {/* GENERIC INPUTS */}
      {!["textarea", "radio", "checkbox", "select", "toggle", "heading", "paragraph", "divider"].includes(field.fieldType) && (
        <input 
          type={field.fieldType === "phone" ? "tel" : field.fieldType}
          value={value || ""}
          onChange={(e) => onChange(field.fieldName, e.target.value)}
          placeholder={`Enter sequence for ${field.fieldName.toLowerCase()}...`}
          className={inputCls} 
        />
      )}

      {/* Validation Errors */}
      {hasError && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 ring-4 ring-red-50/50 p-6 space-y-2 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 mb-1 px-1">
              <AlertCircle size={14} className="text-red-500" strokeWidth={3} />
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Protocol Anomaly Detected</span>
          </div>
          {errors.map((msg, i) => (
            <div key={i} className="flex items-start gap-3 text-red-600">
              <span className="text-[13px] font-black leading-relaxed">{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
