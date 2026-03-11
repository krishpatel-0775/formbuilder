"use client";

import { AlertCircle } from "lucide-react";

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
  const inputCls = `w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium ${hasError
    ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100"
    : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-slate-50/30"
    }`;

  // ── Static elements: render and return early (no label/input/errors) ──
  if (field.fieldType === "heading") {
    return (
      <h2 className="text-2xl font-black text-slate-900 leading-snug pt-4">
        {field.defaultValue || field.fieldName}
      </h2>
    );
  }
  if (field.fieldType === "paragraph") {
    return (
      <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
        {field.defaultValue || field.fieldName}
      </p>
    );
  }
  if (field.fieldType === "divider") {
    return (
      <div className="border-t border-slate-200 my-4" />
    );
  }

  return (
    <div id={`field-${field.fieldName}`} className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 flex-wrap">
        <span>{field.fieldName}</span>
        {(field.required || isRuleRequired) && <span className="text-red-500">*</span>}
        {visibility === "SHOW" && isShowControlled && (
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full normal-case tracking-normal">
            ✓ shown by rule
          </span>
        )}
        {isRuleRequired && (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full normal-case tracking-normal">
            ★ required by rule
          </span>
        )}
      </label>

      {/* TEXTAREA */}
      {field.fieldType === "textarea" && (
        <textarea rows={4} value={value || ""}
          onChange={(e) => onChange(field.fieldName, e.target.value)}
          className={`${inputCls} resize-none`} />
      )}

      {/* RADIO */}
      {field.fieldType === "radio" && (
        <div className="grid gap-3">
          {field.options?.map((opt, idx) => (
            <label key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${value === opt
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : hasError ? "bg-red-50/20 border-red-200 text-slate-600"
                : "bg-slate-50/50 border-slate-100 text-slate-600"
              }`}>
              <input type="radio" name={field.fieldName} value={opt}
                checked={value === opt}
                onChange={(e) => onChange(field.fieldName, e.target.value)}
                className="w-4 h-4 text-blue-600" />
              <span className="font-bold">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* CHECKBOX */}
      {field.fieldType === "checkbox" && (
        <div className="grid gap-3">
          {field.options?.map((opt, idx) => (
            <label key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${value?.includes(opt)
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : hasError ? "bg-red-50/20 border-red-200 text-slate-600"
                : "bg-slate-50/50 border-slate-100 text-slate-600"
              }`}>
              <input type="checkbox" checked={value?.includes(opt)}
                onChange={() => onCheckboxChange(field.fieldName, opt)}
                className="w-4 h-4 rounded text-blue-600" />
              <span className="font-bold">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* SELECT */}
      {field.fieldType === "select" && (
        <div className="relative">
          <select value={value || ""}
            onChange={(e) => onChange(field.fieldName, e.target.value)}
            className={`${inputCls} font-bold appearance-none cursor-pointer`}>
            <option value="" disabled>Select an option</option>
            {field.options?.map((opt, idx) => {
              const isObj = typeof opt === "object" && opt !== null;
              const val = isObj ? opt.id : opt;
              const label = isObj ? opt.value : opt;
              return <option key={idx} value={val}>{label}</option>;
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* TOGGLE */}
      {field.fieldType === "toggle" && (() => {
        const isOn = (value ?? field.defaultValue) === "true";
        return (
          <div
            onClick={() => onChange(field.fieldName, isOn ? "false" : "true")}
            className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all select-none ${
              isOn
                ? "bg-emerald-50 border-emerald-300"
                : hasError
                ? "bg-red-50/30 border-red-200"
                : "bg-slate-50 border-slate-200 hover:border-slate-300"
            }`}>
            <span className={`font-bold text-sm ${isOn ? "text-emerald-800" : "text-slate-600"}`}>
              {isOn ? "Yes / On" : "No / Off"}
            </span>
            <div className={`relative w-14 h-7 rounded-full transition-colors ${
              isOn ? "bg-emerald-500" : "bg-slate-300"
            }`}>
              <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isOn ? "translate-x-8" : "translate-x-1.5"
              }`} />
            </div>
          </div>
        );
      })()}

      {/* TEXT / NUMBER / EMAIL / DATE / PHONE / TIME / URL */}
      {!["textarea", "radio", "checkbox", "select", "toggle", "heading", "paragraph", "divider"].includes(field.fieldType) && (
        <input type={field.fieldType === "phone" ? "tel" : field.fieldType}
          value={value || ""}
          onChange={(e) => onChange(field.fieldName, e.target.value)}
          className={inputCls} />
      )}

      {/* Inline error list */}
      {hasError && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 space-y-1.5">
          {errors.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-red-600">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span className="text-xs font-bold leading-snug">{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
