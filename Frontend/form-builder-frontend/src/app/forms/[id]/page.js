"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Send, ArrowLeft, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ENDPOINTS } from "../../../config/apiConfig";

const evaluateConditionNode = (node, values) => {
  if (!node) return false;
  if (node.conditions && node.conditions.length > 0) {
    const isAnd = node.logicalOperator !== "OR";
    for (let c of node.conditions) {
      const met = evaluateConditionNode(c, values);
      if (isAnd && !met) return false;
      if (!isAnd && met) return true;
    }
    return isAnd;
  }

  const val1 = (values[node.field] || "").toString().trim();
  const val2 = (node.value || "").toString().trim();

  switch (node.operator) {
    case "EQUALS": return val1.toLowerCase() === val2.toLowerCase();
    case "NOT_EQUALS": return val1.toLowerCase() !== val2.toLowerCase();
    case "CONTAINS": return val1.toLowerCase().includes(val2.toLowerCase());
    case "GREATER_THAN": return !isNaN(Number(val1)) && !isNaN(Number(val2)) && Number(val1) > Number(val2);
    case "LESS_THAN": return !isNaN(Number(val1)) && !isNaN(Number(val2)) && Number(val1) < Number(val2);
    default: return false;
  }
};

/**
 * Splits a flat fields array into "pages" based on page_break markers.
 * Returns an array of arrays: [ [field, field, ...], [field, ...], ... ]
 * Each inner array represents one page. Page break items themselves are excluded.
 */
function splitIntoPages(fields) {
  const pages = [];
  let current = [];
  for (const field of fields) {
    // Only page_break acts as a separator; heading/paragraph/divider stay on the current page
    if (field.fieldType === "page_break") {
      pages.push(current);
      current = [];
    } else {
      current.push(field);
    }
  }
  pages.push(current);
  // Remove empty page groups (e.g., two consecutive page breaks)
  return pages.filter((p) => p.length > 0);
}

export default function PublicFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const [formConfig, setFormConfig] = useState(null);
  const [pages, setPages] = useState([]); // [[field,...], ...]
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldVisibility, setFieldVisibility] = useState({});
  const [showTargetFields, setShowTargetFields] = useState(new Set());
  const [formRules, setFormRules] = useState([]);
  const [dynamicRequiredFields, setDynamicRequiredFields] = useState(new Set());
  // Slide direction for animation
  const [slideDir, setSlideDir] = useState("forward"); // "forward" | "back"

  useEffect(() => {
    if (!id) return;
    fetch(`${ENDPOINTS.FORMS}/${id}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(async (res) => {
        if (!res) { setLoading(false); return; }
        const data = res.data;

        if (data.status !== "PUBLISHED") { setLoading(false); return; }

        // Fetch dynamic dropdown options
        if (data?.fields) {
          await Promise.all(
            data.fields.map(async (field) => {
              if (field.fieldType === "select" && field.sourceTable && field.sourceColumn) {
                try {
                  const optRes = await fetch(`${ENDPOINTS.FORMS}/${field.sourceTable}/lookup/${field.sourceColumn}`);
                  if (optRes.ok) {
                    const optJson = await optRes.json();
                    field.options = optJson.data || [];
                  }
                } catch (err) {
                  console.error("Failed to fetch dynamic options for", field.fieldName, err);
                }
              }
            })
          );
        }

        let parsedRules = [];
        try {
          if (data.rules) {
            parsedRules = typeof data.rules === "string" ? JSON.parse(data.rules) : data.rules;
            setFormRules(parsedRules);

            const targets = new Set(
              parsedRules
                .filter((r) => r.action?.type === "SHOW" && r.action?.targetField && r.action.targetField !== "__FIELD_ORDER__")
                .map((r) => r.action.targetField)
            );
            setShowTargetFields(targets);

            const orderRule = parsedRules.find(r => r.action?.targetField === "__FIELD_ORDER__");
            if (orderRule && orderRule.action?.message && data.fields) {
              const orderArray = orderRule.action.message.split(",");
              data.fields.sort((a, b) => {
                let aName = a.fieldName || "";
                let bName = b.fieldName || "";
                let aIdx = orderArray.indexOf(aName);
                let bIdx = orderArray.indexOf(bName);
                if (aIdx === -1) aIdx = 999;
                if (bIdx === -1) bIdx = 999;
                return aIdx - bIdx;
              });
            }
          }
        } catch (e) {
          console.warn("Could not load rules:", e);
        }

        setFormConfig(data);

        // Split fields into pages
        const splitPages = splitIntoPages(data.fields || []);
        setPages(splitPages);

        // Initialize form data
        const initialData = {};
        if (data?.fields) {
          data.fields.forEach((field) => {
            if (field.fieldType === "page_break") return;
            if (field.fieldType === "checkbox") {
              const defaultVals = field.defaultValue
                ? field.defaultValue.split(",").map((v) => v.trim()).filter(Boolean)
                : [];
              initialData[field.fieldName] = field.options?.length > 0
                ? defaultVals.filter(v => field.options.includes(v))
                : defaultVals;
            } else if (["radio", "select"].includes(field.fieldType)) {
              let v = field.defaultValue ?? "";
              if (v && field.options?.length > 0 && !field.options.includes(v)) v = "";
              initialData[field.fieldName] = v;
            } else {
              initialData[field.fieldName] = field.defaultValue ?? "";
            }
          });
        }
        setFormData(initialData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching form:", err);
        setLoading(false);
      });
  }, [id]);

  const evaluateVisibility = useCallback((currentData) => {
    if (!formRules || formRules.length === 0) return;

    const newVisibility = {};
    formRules.forEach(rule => {
      const action = rule.action;
      if (!action || !action.targetField || action.targetField === "__FIELD_ORDER__") return;
      if (action.type !== "SHOW" && action.type !== "HIDE") return;

      if (evaluateConditionNode(rule.condition, currentData)) {
        newVisibility[action.targetField] = action.type;
      }
    });

    setFieldVisibility(newVisibility);
  }, [formRules]);

  useEffect(() => {
    if (!formConfig) return;
    const required = new Set();
    formRules.forEach(rule => {
      if (rule.action?.type === "REQUIRE" && rule.action.targetField) {
        if (evaluateConditionNode(rule.condition, formData)) {
          required.add(rule.action.targetField);
        }
      }
    });
    setDynamicRequiredFields(required);
    const timer = setTimeout(() => evaluateVisibility(formData), 300);
    return () => clearTimeout(timer);
  }, [formData, formConfig, evaluateVisibility, formRules]);

  // ── Validate only fields on the given page ─────────────────────────────────
  const validatePage = (pageFields) => {
    const newErrors = {};
    const push = (name, msg) => {
      if (!newErrors[name]) newErrors[name] = [];
      newErrors[name].push(msg);
    };

    pageFields.forEach((field) => {
      if (fieldVisibility[field.fieldName] === "HIDE") return;
      if (showTargetFields.has(field.fieldName) && fieldVisibility[field.fieldName] !== "SHOW") return;

      const value = formData[field.fieldName];
      const name = field.fieldName;

      if (field.required || dynamicRequiredFields.has(field.fieldName)) {
        if (field.fieldType === "checkbox") {
          if (!value || value.length === 0)
            push(name, field.required ? "Please select at least one option." : "This field is required based on the form rules.");
        } else if (!value || value.toString().trim() === "") {
          push(name, field.required ? "This field is required." : "This field is required based on the form rules.");
        }
      }

      const strVal = value?.toString().trim() ?? "";
      if (!strVal && field.fieldType !== "checkbox") return;
      if (field.fieldType === "checkbox" && (!value || value.length === 0)) return;

      const isStringField = ["text", "email", "textarea", "phone", "url"].includes(field.fieldType);
      if (isStringField) {
        if (field.minLength && strVal.length < Number(field.minLength))
          push(name, `Minimum ${field.minLength} characters required (you entered ${strVal.length}).`);
        if (field.maxLength && strVal.length > Number(field.maxLength))
          push(name, `Maximum ${field.maxLength} characters allowed (you entered ${strVal.length}).`);
      }

      if (field.pattern && ["text", "email"].includes(field.fieldType)) {
        try {
          if (!new RegExp(field.pattern).test(strVal))
            push(name, `Value does not match the required format (${field.pattern}).`);
        } catch (_) { }
      }

      if (field.fieldType === "email" && !field.pattern) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal))
          push(name, "Enter a valid email address (e.g. user@example.com).");
      }

      if (field.fieldType === "number") {
        const numVal = Number(strVal);
        if (isNaN(numVal)) {
          push(name, "Must be a valid number.");
        } else {
          if (field.min !== null && field.min !== undefined && numVal < Number(field.min))
            push(name, `Value must be at least ${field.min} (you entered ${numVal}).`);
          if (field.max !== null && field.max !== undefined && numVal > Number(field.max))
            push(name, `Value must be at most ${field.max} (you entered ${numVal}).`);
        }
      }

      if (field.fieldType === "date") {
        const selected = new Date(strVal);
        if (isNaN(selected)) {
          push(name, "Enter a valid date.");
        } else {
          selected.setHours(0, 0, 0, 0);
          if (field.afterDate) {
            const after = new Date(field.afterDate); after.setHours(0, 0, 0, 0);
            if (selected < after) push(name, `Date must be after ${field.afterDate}.`);
          }
          if (field.beforeDate) {
            const before = new Date(field.beforeDate); before.setHours(0, 0, 0, 0);
            if (selected > before) push(name, `Date must be before ${field.beforeDate}.`);
          }
        }
      }

      if (field.fieldType === "time") {
        if (field.afterTime && strVal < field.afterTime)
          push(name, `Time must be after ${field.afterTime}.`);
        if (field.beforeTime && strVal > field.beforeTime)
          push(name, `Time must be before ${field.beforeTime}.`);
      }

      if (field.fieldType === "phone") {
        const digits = strVal.replace(/[\s\-()+.]/g, "");
        if (!/^\d{7,15}$/.test(digits))
          push(name, "Enter a valid phone number (7–15 digits).");
        if (field.pattern) {
          try {
            if (!new RegExp(field.pattern).test(strVal))
              push(name, `Phone number does not match the required format.`);
          } catch (_) { }
        }
      }
    });

    // Rule engine validation errors (only for fields on this page)
    const pageFieldNames = new Set(pageFields.map(f => f.fieldName));
    formRules.forEach(rule => {
      if (rule.action?.type === "VALIDATION_ERROR") {
        if (evaluateConditionNode(rule.condition, formData)) {
          let target = rule.action.targetField;
          if (!target && rule.condition?.conditions?.length > 0) {
            target = rule.condition.conditions[0].field;
          }
          if (target && pageFieldNames.has(target)) {
            push(target, rule.action.message || "Submission rejected by rules.");
          }
        }
      }
    });

    return newErrors;
  };

  const validateAllPages = () => {
    const allFields = pages.flat();
    return validatePage(allFields);
  };

  const handleCheckboxChange = (fieldName, optionValue) => {
    const current = formData[fieldName] || [];
    const updated = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    handleInputChange(fieldName, updated);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
    }
  };

  const handleNext = () => {
    if (!pages[currentPage]) return;
    const pageErrors = validatePage(pages[currentPage]);
    if (Object.keys(pageErrors).length > 0) {
      setErrors(pageErrors);
      const firstKey = Object.keys(pageErrors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setSlideDir("forward");
    setCurrentPage((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setErrors({});
    setSlideDir("back");
    setCurrentPage((p) => p - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formConfig) return;

    const validationErrors = validateAllPages();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch(ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: parseInt(id), values: formData }),
      });

      if (res.ok) {
        router.push(`/forms/data/${id}`);
      } else {
        const errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          setErrors((prev) => ({ ...prev, _ruleError: [errorData.message || "Submission failed"] }));
        } catch (e) {
          setErrors((prev) => ({ ...prev, _ruleError: [errorText || "Submission failed"] }));
        }
      }
    } catch (err) {
      alert("Connection failed. Check backend/CORS settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading / not found states ────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Form...</p>
      </div>
    );

  if (!formConfig)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold">Form not found.</p>
      </div>
    );

  const totalPages = pages.length;
  const isMultiPage = totalPages > 1;
  const isLastPage = currentPage === totalPages - 1;
  const currentPageFields = pages[currentPage] || [];
  const progressPct = totalPages > 1 ? Math.round(((currentPage + 1) / totalPages) * 100) : 100;

  const totalErrors = Object.entries(errors)
    .filter(([k]) => k !== "_ruleError")
    .reduce((acc, [, msgs]) => acc + msgs.length, 0);

  const renderField = (field) => {
    const fieldErrors = errors[field.fieldName];
    const hasError = fieldErrors && fieldErrors.length > 0;
    const visState = fieldVisibility[field.fieldName];
    const isShowControlled = showTargetFields.has(field.fieldName);
    const isRuleShown = visState === "SHOW";
    const isRuleHidden = visState === "HIDE";
    const isRuleRequired = dynamicRequiredFields.has(field.fieldName);

    if (isRuleHidden) return null;
    if (isShowControlled && !isRuleShown) return null;

    const inputCls = `w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium ${hasError
      ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-slate-50/30"
      }`;

    return (
      <div key={field.id} id={`field-${field.fieldName}`} className="space-y-3">

        {/* ── Static elements: render and return early (no label/input/errors) ── */}
        {field.fieldType === "heading" && (
          <h2 className="text-2xl font-black text-slate-900 leading-snug">
            {field.defaultValue || field.fieldName}
          </h2>
        )}
        {field.fieldType === "paragraph" && (
          <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
            {field.defaultValue || field.fieldName}
          </p>
        )}
        {field.fieldType === "divider" && (
          <div className="border-t border-slate-200 my-2" />
        )}

        {/* Skip rest of rendering for static + display-only types */}
        {["heading", "paragraph", "divider"].includes(field.fieldType) ? null : (
          <>
        {/* Label */}
        <label className="block text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 flex-wrap">
          <span>{field.fieldName}</span>
          {(field.required || isRuleRequired) && <span className="text-red-500">*</span>}
          {isRuleShown && (
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
          <textarea rows={4} value={formData[field.fieldName] || ""}
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`${inputCls} resize-none`} />
        )}

        {/* RADIO */}
        {field.fieldType === "radio" && (
          <div className="grid gap-3">
            {field.options?.map((opt, idx) => (
              <label key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData[field.fieldName] === opt
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : hasError ? "bg-red-50/20 border-red-200 text-slate-600"
                  : "bg-slate-50/50 border-slate-100 text-slate-600"
                }`}>
                <input type="radio" name={field.fieldName} value={opt}
                  checked={formData[field.fieldName] === opt}
                  onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
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
              <label key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData[field.fieldName]?.includes(opt)
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : hasError ? "bg-red-50/20 border-red-200 text-slate-600"
                  : "bg-slate-50/50 border-slate-100 text-slate-600"
                }`}>
                <input type="checkbox" checked={formData[field.fieldName]?.includes(opt)}
                  onChange={() => handleCheckboxChange(field.fieldName, opt)}
                  className="w-4 h-4 rounded text-blue-600" />
                <span className="font-bold">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* SELECT */}
        {field.fieldType === "select" && (
          <div className="relative">
            <select value={formData[field.fieldName] || ""}
              onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
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
          const isOn = (formData[field.fieldName] ?? field.defaultValue) === "true";
          return (
            <div
              onClick={() => handleInputChange(field.fieldName, isOn ? "false" : "true")}
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
        {!["textarea", "radio", "checkbox", "select", "toggle"].includes(field.fieldType) && (
          <input type={field.fieldType === "phone" ? "tel" : field.fieldType}
            value={formData[field.fieldName] || ""}
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={inputCls} />
        )}

        {/* Inline error list */}
        {hasError && (
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 space-y-1.5">
            {fieldErrors.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 text-red-600">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <span className="text-xs font-bold leading-snug">{msg}</span>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 font-bold text-sm uppercase tracking-widest">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">

          {/* Form header */}
          <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-4xl font-black text-slate-900 capitalize mb-2">{formConfig.formName}</h1>
            {isMultiPage ? (
              <div className="space-y-3 mt-4">
                {/* Page counter */}
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 font-medium text-sm">
                    Step <span className="font-black text-slate-800">{currentPage + 1}</span> of <span className="font-black text-slate-800">{totalPages}</span>
                  </p>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    {progressPct}% complete
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <div key={i} className={`rounded-full transition-all duration-300 ${i === currentPage
                      ? "w-6 h-2 bg-blue-500"
                      : i < currentPage
                        ? "w-2 h-2 bg-blue-300"
                        : "w-2 h-2 bg-slate-200"
                      }`} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 font-medium mt-1">Please fill the details below.</p>
            )}
          </div>

          {/* Global error banner (only when errors on current page) */}
          {totalErrors > 0 && (
            <div className="mx-8 md:mx-12 mt-8 rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-red-100/60 border-b border-red-200">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-black text-red-700 uppercase tracking-wide">
                  {totalErrors} error{totalErrors > 1 ? "s" : ""} — please fix before continuing
                </p>
              </div>
              <ul className="px-5 py-4 space-y-1.5">
                {Object.entries(errors).filter(([k]) => k !== "_ruleError").map(([fieldName, msgs]) =>
                  msgs.map((msg, i) => (
                    <li key={`${fieldName}-${i}`} className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <button type="button"
                        onClick={() => {
                          const el = document.getElementById(`field-${fieldName}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline text-left">
                        <span className="text-red-400 uppercase">{fieldName}:</span> {msg}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Form fields for current page */}
          <form onSubmit={isLastPage ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} noValidate
            className="p-8 md:p-12 space-y-10">

            {/* Rule engine validation error banner */}
            {errors._ruleError && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-red-700">Submission Rejected</p>
                  <p className="text-xs text-red-600 mt-0.5 font-medium">{errors._ruleError[0]}</p>
                </div>
              </div>
            )}

            {currentPageFields.map(renderField)}

            {/* Navigation buttons */}
            <div className={`flex gap-4 mt-6 ${currentPage > 0 ? "justify-between" : "justify-end"}`}>
              {currentPage > 0 && (
                <button type="button" onClick={handleBack}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.99]">
                  <ChevronLeft size={20} /> Back
                </button>
              )}

              {isLastPage ? (
                <button type="submit" disabled={isSubmitting}
                  className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${isSubmitting
                    ? "bg-slate-300 cursor-not-allowed text-slate-500"
                    : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl hover:shadow-blue-600/20 active:scale-[0.99]"
                    }`}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  {isSubmitting ? "Processing..." : "Submit Response"}
                </button>
              ) : (
                <button type="submit"
                  className="flex-1 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-blue-600 shadow-xl hover:shadow-blue-600/20 active:scale-[0.99]">
                  Next <ChevronRight size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}