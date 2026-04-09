"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Star, Zap, ChevronRight, Upload, File, Loader2, Lock, Sparkles, X } from "lucide-react";

export function FormFieldWrapper({
  field,
  value,
  onChange,
  errors = [],
  visibility = "SHOW",
  isShowControlled = false,
  isRuleRequired = false,
  onCheckboxChange,
  label // Added label prop for display
}) {
  const [isOpen, setIsOpen] = useState(false); // For select field
  const fieldIdentifier = field.fieldKey || field.fieldName;
  const displayLabel = label || field.fieldName;

  if (visibility === "HIDE") return null;
  if (isShowControlled && visibility !== "SHOW") return null;

  const hasError = errors && errors.length > 0;
  const inputBase = "w-full px-6 py-5 rounded-[1.5rem] border transition-all duration-500 outline-none font-medium text-[16px] shadow-sm";
  const inputCls = `${inputBase} ${hasError
    ? "border-red-200 bg-red-50/20 text-red-900 placeholder:text-red-200 focus:border-red-400 focus:ring-8 focus:ring-red-50"
    : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-300 focus:border-primary focus:ring-8 focus:ring-primary/5 hover:border-slate-300 shadow-sm"
    }`;
  
  const currentVals = Array.isArray(value)
    ? value
    : (value || "").toString().split(",").map(v => v.trim()).filter(Boolean);

  // ── Static elements: render and return early (no label/input/errors) ──
  if (field.fieldType === "heading") {
    return (
      <div className="pt-8 pb-4">
        <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
          {field.defaultValue || displayLabel}
        </h2>
        <div className="w-12 h-1.5 bg-primary rounded-full mt-4" />
      </div>
    );
  }
  if (field.fieldType === "paragraph") {
    return (
      <p className="text-[15px] text-slate-500 leading-relaxed font-medium bg-slate-50/30 p-6 rounded-[2rem] border border-slate-100/50 italic">
        {field.defaultValue || displayLabel}
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
  if (field.fieldType === "page_break") {
    return (
      <div className="relative py-12">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-slate-100" />
        </div>
        <div className="relative flex justify-center">
          <div className="bg-slate-50 border border-slate-100 px-6 py-2 rounded-full shadow-sm">
            <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{field.label || "Page Break"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={`field-${fieldIdentifier}`} className="space-y-2.5 group animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Label Area */}
      <div className="flex items-center justify-between px-1">
        <label className="text-[14px] font-bold text-slate-700 flex items-center gap-1.5 transition-colors group-focus-within:text-primary pl-1">
          <span>{displayLabel}</span>
          {(field.required || isRuleRequired) && <span className="text-red-500 text-xl leading-none mt-1">*</span>}
        </label>
        <div className="flex gap-2">
          {visibility === "SHOW" && isShowControlled && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider">
              <Zap size={10} strokeWidth={3} /> Show Logic
            </div>
          )}
          {isRuleRequired && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-wider">
              <Star size={10} fill="currentColor" /> Mandatory
            </div>
          )}
          {field.isReadOnly && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-wider">
              <Lock size={10} strokeWidth={3} /> Read Only
            </div>
          )}
        </div>
      </div>

      {/* TEXTAREA */}
      {field.fieldType === "textarea" && (
        <textarea
          rows={5}
          value={value || ""}
          onChange={(e) => onChange(fieldIdentifier, e.target.value)}
          placeholder={field.placeholder || `Enter your ${displayLabel.toLowerCase()} details...`}
          className={`${inputCls} resize-none leading-relaxed ${field.isReadOnly ? "opacity-60 cursor-not-allowed bg-slate-100/50" : ""}`}
          readOnly={field.isReadOnly}
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
              <label key={idx} className={`flex items-center justify-between p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 ${isActive
                ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 text-primary"
                : hasError
                  ? "bg-red-50/20 border-red-100 text-slate-500"
                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? "border-primary bg-primary" : "border-slate-200 bg-white"
                    }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-300" />}
                  </div>
                  <span className="font-bold text-[16px]">{optLabel}</span>
                </div>
                {isActive && <CheckCircle2 size={18} strokeWidth={3} className="animate-in slide-in-from-right-2 fade-in" />}
                <input type="radio" name={fieldIdentifier} value={optVal} checked={isActive}
                  onChange={() => !field.isReadOnly && onChange(fieldIdentifier, optVal)}
                  disabled={field.isReadOnly}
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
            const isActive = currentVals.some(v => v == optVal);

            return (
              <label key={idx} className={`flex items-center justify-between p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 ${isActive
                ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 text-primary"
                : hasError
                  ? "bg-red-50/30 border-red-100 text-slate-500"
                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? "border-primary bg-primary" : "border-slate-200 bg-white"
                    }`}>
                    {isActive && <CheckCircle2 size={14} strokeWidth={4} className="text-white animate-in zoom-in duration-300" />}
                  </div>
                  <span className="font-bold text-[16px]">{optLabel}</span>
                </div>
                <input type="checkbox" checked={isActive}
                  onChange={() => !field.isReadOnly && onCheckboxChange(fieldIdentifier, optVal)}
                  disabled={field.isReadOnly}
                  className="hidden" />
              </label>
            );
          })}
        </div>
      )}

      {/* SELECT (Single/Multi) */}
      {field.fieldType === "select" && (
        !field.isMultiSelect ? (
          <div className="relative group/select">
            <select value={value || ""}
              onChange={(e) => onChange(fieldIdentifier, e.target.value)}
              disabled={field.isReadOnly}
              className={`${inputCls} appearance-none cursor-pointer pr-16 ${field.isReadOnly ? "opacity-60 cursor-not-allowed bg-slate-100/50" : ""}`}>
              <option value="" disabled>Select an option...</option>
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
        ) : (
          <div className="relative">
            <div
              onClick={() => !field.isReadOnly && setIsOpen(!isOpen)}
              className={`${inputBase} flex flex-wrap gap-2 min-h-[64px] items-center pr-12 cursor-pointer ${isOpen ? "border-primary ring-8 ring-primary/5 bg-white" : "border-slate-100 bg-slate-50/50"} ${field.isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {currentVals.length === 0 ? (
                <span className="text-slate-300 font-bold ml-1">Select multiple options...</span>
              ) : (
                currentVals.map((val, i) => {
                  const opt = field.options?.find(o => (typeof o === 'object' ? o.id == val : o == val));
                  const label = typeof opt === 'object' ? opt.value : opt;
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/10 rounded-xl text-[11px] font-black uppercase tracking-wider animate-in zoom-in duration-300">
                      {label}
                      {!field.isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCheckboxChange(fieldIdentifier, val);
                          }}
                          className="hover:text-slate-900 transition-colors"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors">
                <ChevronRight size={20} className={`transition-transform duration-300 ${isOpen ? "rotate-[-90deg]" : "rotate-90"}`} strokeWidth={3} />
              </div>
            </div>

            {isOpen && !field.isReadOnly && (
              <>
                <div 
                  className="fixed inset-0 z-[60]" 
                  onClick={() => setIsOpen(false)} 
                />
                <div className="absolute top-full left-0 right-0 mt-3 p-3 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.1)] z-[70] animate-in slide-in-from-top-4 duration-500 overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1.5 p-1">
                    {field.options?.map((opt, idx) => {
                      const isObj = typeof opt === "object" && opt !== null;
                      const optVal = isObj ? opt.id : opt;
                      const optLabel = isObj ? opt.value : opt;
                      const isActive = currentVals.some(v => v == optVal);

                      return (
                        <div
                          key={idx}
                          onClick={() => onCheckboxChange(fieldIdentifier, optVal)}
                          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 ${isActive
                            ? "bg-primary/5 text-primary"
                            : "hover:bg-slate-50 text-slate-600"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isActive ? "border-primary bg-primary" : "border-slate-200 bg-white"
                              }`}>
                              {isActive && <CheckCircle2 size={12} strokeWidth={4} className="text-white" />}
                            </div>
                            <span className="font-bold text-sm tracking-wide">{optLabel}</span>
                          </div>
                          {isActive && <Sparkles size={14} className="text-primary/40 animate-in fade-in" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      )}

      {/* TOGGLE */}
      {field.fieldType === "toggle" && (() => {
        const isOn = (value ?? field.defaultValue) === "true";
        return (
          <div
            onClick={() => !field.isReadOnly && onChange(fieldIdentifier, isOn ? "false" : "true")}
            className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-700 select-none ${isOn
              ? "bg-emerald-50 border-emerald-300 shadow-xl shadow-emerald-500/5 text-emerald-900"
              : hasError
                ? "bg-red-50/30 border-red-200 text-red-900"
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
              } ${field.isReadOnly ? "opacity-60 cursor-not-allowed bg-slate-100/50" : ""}`}>
            <span className="font-bold text-[14px] pl-2">
              {isOn ? "Active" : "Standby"}
            </span>
            <div className={`relative w-16 h-8 rounded-full transition-all duration-500 ${isOn ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-slate-200"
              }`}>
              <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 ${isOn ? "translate-x-9 scale-110" : "translate-x-1.5"
                }`} />
            </div>
          </div>
        );
      })()}

      {/* FILE UPLOAD */}
      {field.fieldType === "file_upload" && (
        <FileUploadItem field={field} value={value} onChange={onChange} hasError={hasError} inputCls={inputCls} />
      )}

      {/* GENERIC INPUTS */}
      {!["textarea", "radio", "checkbox", "select", "toggle", "file_upload", "heading", "paragraph", "divider"].includes(field.fieldType) && (
        <input
          type={field.fieldType === "phone" ? "tel" : field.fieldType === "datetime" ? "datetime-local" : (field.fieldType === "decimal" || field.fieldType === "number") ? "number" : field.fieldType}
          step={field.fieldType === "decimal" ? "any" : field.fieldType === "number" ? "1" : undefined}
          value={value || ""}
          onChange={(e) => onChange(fieldIdentifier, e.target.value)}
          onKeyDown={(e) => {
            if (field.fieldType === "number" && (e.key === "." || e.key === "e" || e.key === "E")) {
              e.preventDefault();
            }
          }}
          onWheel={(e) => (e.target.type === "number" || field.fieldType === "decimal") && e.target.blur()} 
          placeholder={field.placeholder || `Enter sequence for ${displayLabel.toLowerCase()}...`}
          className={`${inputCls} ${field.isReadOnly ? "opacity-60 cursor-not-allowed bg-slate-100/50" : ""}`}
          readOnly={field.isReadOnly}
        />
      )}

      {/* HELPER TEXT */}
      {field.helperText && !hasError && (
        <p className="text-[12px] font-medium text-slate-400 px-1 mt-1">
          {field.helperText}
        </p>
      )}

      {/* Validation Errors */}
      {hasError && (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 ring-4 ring-red-50/50 p-6 space-y-2 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 mb-1 px-1">
            <AlertCircle size={14} className="text-red-500" strokeWidth={3} />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Status</span>
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

function FileUploadItem({ field, value, onChange, hasError, inputCls }) {
  const [uploading, setUploading] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fieldIdentifier = field.fieldKey || field.fieldName;
  const displayLabel = field.fieldName;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLocalFile(file);
    setUploadError(null);

    // Client-side Validation
    if (field.maxFileSize) {
      const maxSizeInBytes = Number(field.maxFileSize) * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setUploadError(`File size exceeds ${field.maxFileSize}MB limit`);
        return;
      }
    }

    if (field.allowedFileTypes) {
      const extension = file.name.split('.').pop().toLowerCase();
      const allowed = field.allowedFileTypes.toLowerCase().split(',').map(t => t.trim());
      if (!allowed.includes(extension)) {
        setUploadError(`Invalid file type. Allowed: ${field.allowedFileTypes}`);
        return;
      }
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fieldId", field._dbId || field.id);

    try {
      const res = await fetch("http://localhost:9090/api/v1/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (res.ok) {
        const json = await res.json();
        onChange(fieldIdentifier, json.data.toString());
      } else {
        const err = await res.json();
        setUploadError(err.message || "Upload failed");
      }
    } catch (err) {
      setUploadError("Connection error during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative group/upload">
        <input
          type="file"
          onChange={handleFileChange}
          className={`absolute inset-0 opacity-0 z-10 ${field.isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
          disabled={uploading || field.isReadOnly}
        />
        <div className={`${inputCls} flex items-center gap-4 py-8 border-dashed border-2 group-hover/upload:border-primary group-hover/upload:bg-primary/5 transition-all text-center justify-center`}>
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : value ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          ) : (
            <Upload className="w-8 h-8 text-slate-300 group-hover/upload:text-primary transition-colors" />
          )}
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight">
              {uploading ? <span>Saving...</span> : value ? <span>Saved Recently</span> : `Upload ${displayLabel}`}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {localFile ? localFile.name : `Max Size: ${field.maxFileSize || 5}MB | ${field.allowedFileTypes || 'All Types'}`}
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
          <AlertCircle size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Error</span>
        </div>
      )}

    </div>
  );
}
