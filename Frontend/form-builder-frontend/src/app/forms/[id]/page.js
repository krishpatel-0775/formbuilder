"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Send, ArrowLeft, Loader2, ChevronRight, ChevronLeft, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ENDPOINTS } from "../../../config/apiConfig";
import { FormFieldWrapper } from "../../../components/builder/FormFieldWrapper";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../utils/apiClient";

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
    case "GREATER_THAN_OR_EQUAL": return !isNaN(Number(val1)) && !isNaN(Number(val2)) && Number(val1) >= Number(val2);
    case "LESS_THAN_OR_EQUAL": return !isNaN(Number(val1)) && !isNaN(Number(val2)) && Number(val1) <= Number(val2);
    case "IS_EMPTY": return val1 === "";
    case "IS_NOT_EMPTY": return val1 !== "";
    case "STARTS_WITH": return val1.toLowerCase().startsWith(val2.toLowerCase());
    case "ENDS_WITH": return val1.toLowerCase().endsWith(val2.toLowerCase());
    case "REGEX_MATCH": {
      try {
        return new RegExp(val2, "i").test(val1);
      } catch (e) {
        return false;
      }
    }
    default: return false;
  }
};

/**
 * Evaluates a single flat formula against current form data.
 * Returns null for division by zero or missing/NaN operands.
 */
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
        if (val === 0) return null; // Division by zero still returns null
        acc /= val;
      }
    }
    return acc;
  } catch (e) {
    return null;
  }
}

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

function getInitialFormData(fields) {
  const initialData = {};
  if (!fields) return initialData;

  fields.forEach((field) => {
    if (field.fieldType === "page_break") return;

    const options = field.options || [];
    const isOptionValid = (val) => {
      if (options.length === 0) return true;
      return options.some(opt => {
        if (typeof opt === "object" && opt !== null) {
          return opt.id == val || opt.value == val;
        }
        return opt == val;
      });
    };

    if (field.fieldType === "checkbox") {
      const defaultVals = field.defaultValue
        ? field.defaultValue.toString().split(",").map((v) => v.trim()).filter(Boolean)
        : [];
      initialData[field.fieldKey || field.fieldName] = options.length > 0
        ? defaultVals.filter(v => isOptionValid(v))
        : defaultVals;
    } else if (field.fieldType === "radio") {
      let v = field.defaultValue ?? "";
      if (v && options.length > 0 && !isOptionValid(v)) v = "";
      initialData[field.fieldKey || field.fieldName] = v;
    } else if (field.fieldType === "select") {
      if (field.isMultiSelect) {
        const defaultVals = field.defaultValue
          ? field.defaultValue.toString().split(",").map((v) => v.trim()).filter(Boolean)
          : [];
        initialData[field.fieldKey || field.fieldName] = options.length > 0
          ? defaultVals.filter(v => isOptionValid(v))
          : defaultVals;
      } else {
        let v = field.defaultValue ?? "";
        if (v && options.length > 0 && !isOptionValid(v)) v = "";
        initialData[field.fieldKey || field.fieldName] = v;
      }
    } else {

      initialData[field.fieldKey || field.fieldName] = field.defaultValue ?? "";
    }
  });
  return initialData;
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftSubmissionId, setDraftSubmissionId] = useState(null);
  const [draftBanner, setDraftBanner] = useState(null);
  const [draftSaveMessage, setDraftSaveMessage] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    apiClient.get(`${ENDPOINTS.FORMS}/${id}`)
      .then(async (res) => {
        const data = res.data.data;

        if (data.status !== "PUBLISHED") { setLoading(false); return; }

        // Fetch dynamic dropdown options
        if (data?.fields) {
          await Promise.all(
            data.fields.map(async (field) => {
              if (["select", "radio", "checkbox"].includes(field.fieldType) && field.sourceTable && field.sourceColumn) {
                try {
                  const optRes = await apiClient.get(`${ENDPOINTS.FORMS}/${field.sourceTable}/lookup/${field.sourceColumn}`);
                  field.options = optRes.data.data || [];
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
            
            // Sort rules by executionOrder for client-side evaluation
            parsedRules.sort((a, b) => {
              const orderA = a.executionOrder ?? Infinity;
              const orderB = b.executionOrder ?? Infinity;
              return orderA - orderB;
            });
            
            setFormRules(parsedRules);

            const targets = new Set(
              parsedRules
                .filter((r) => r.action?.type === "SHOW" && r.action?.targetField)
                .map((r) => r.action.targetField)
            );
            setShowTargetFields(targets);
          }
        } catch (e) {
          console.warn("Could not load rules:", e);
        }

        setFormConfig(data);

        // FIXED: Resolve parentId and Build Hierarchy for Rendering
        const fields = (data.fields || []).map(f => ({ ...f }));
        
        // 1. Resolve parentId (Key string -> internal ID)
        fields.forEach(f => {
          if (f.parentId) {
            const parent = fields.find(p => p.fieldKey === f.parentId);
            if (parent) f.parentId = parent.id;
          }
        });

        // 2. Build Tree Structure (children array for groups)
        const fieldMap = {};
        fields.forEach(f => {
          f.children = [];
          fieldMap[f.id] = f;
        });

        const rootFields = [];
        fields.forEach(f => {
          if (f.parentId && fieldMap[f.parentId]) {
            fieldMap[f.parentId].children.push(f);
          } else {
            rootFields.push(f);
          }
        });

        // Split fields into pages (only root-level fields are processed for pagination)
        const splitPages = rootFields.length > 0 ? splitIntoPages(rootFields) : [];
        setPages(splitPages);

        // Initialize form data (use ALL fields including nested ones)
        const initialData = getInitialFormData(fields);
        setFormData(initialData);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching form:", err);
        setLoading(false);
      });
  }, [id]);

  // ── Fetch existing draft when user and formConfig are ready ────────────────
  useEffect(() => {
    if (!id || !user || !formConfig) return;

    const fetchDraft = async () => {
      try {
        const res = await apiClient.get(`${ENDPOINTS.SUBMISSIONS}/draft`, { params: { formId: id } });
        if (res.data.success && res.data.data) {
          const draft = res.data.data;
          const activeVersion = formConfig.formVersionId || null;
          if (activeVersion === null || draft.formVersionId === activeVersion) {
            setFormData(prev => ({ ...prev, ...draft.data }));
            setDraftSubmissionId(draft.submissionId);
            setDraftBanner({ type: "success", message: "You have a saved draft. Resuming where you left off." });
          } else {
            setDraftBanner({ type: "warning", message: "Your previous draft was for an older version of this form and cannot be restored." });
          }
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
      }
    };

    fetchDraft();
  }, [id, user, formConfig]);

  // ── Debounced Auto-save Effect ─────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user || !formConfig || !isDirty) return;

    // Don't auto-save if exactly same as last save
    const currentStr = JSON.stringify(formData);
    if (lastSavedData === currentStr) return;

    const timer = setTimeout(() => {
      handleSaveDraft(true); // true = quiet mode (minimal UI feedback)
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, user, formConfig, isDirty, lastSavedData, id]);

  const evaluateVisibility = useCallback((currentData) => {
    if (!formRules || formRules.length === 0) return;

    const newVisibility = {};
    formRules.forEach(rule => {
      const action = rule.action;
      if (!action || !action.targetField) return;
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

  // ── Real-time computed fields ───────────────────────────────────────────────
  // Re-run whenever formData changes to keep calculated outputs in sync.
  useEffect(() => {
    if (!formConfig?.fields) return;
    const calculatedFields = formConfig.fields.filter(
      (f) => f.isCalculated && f.calculationFormula
    );
    if (calculatedFields.length === 0) return;

    setFormData((prev) => {
      let updated = { ...prev };
      let changed = false;
      for (const f of calculatedFields) {
        const key = f.fieldKey || f.fieldName;
        const result = computeFormula(f.calculationFormula, prev);
        let newVal = "";
        if (result !== null) {
          // If the target field is 'number', truncate to integer.
          // Otherwise, preserve decimal as a string.
          if (f.fieldType === "number") {
            newVal = String(Math.trunc(result));
          } else {
            newVal = String(result);
          }
        }
        if (updated[key] !== newVal) {
          updated[key] = newVal;
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, [formData, formConfig]);

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

      const value = formData[field.fieldKey || field.fieldName];
      const name = field.fieldKey || field.fieldName;

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

      if (field.pattern && ["text", "email", "url"].includes(field.fieldType)) {
        try {
          if (!new RegExp(field.pattern).test(strVal))
            push(name, `Value does not match the required format (${field.pattern}).`);
        } catch (_) { }
      }

      if (field.fieldType === "email" && !field.pattern) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal))
          push(name, "Enter a valid email address (e.g. user@example.com).");
      }

      if (field.fieldType === "number" || field.fieldType === "decimal") {
        const numVal = Number(strVal);
        if (isNaN(numVal)) {
          push(name, field.fieldType === "decimal" ? "Must be a valid decimal number." : "Must be a valid number.");
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

      if (field.fieldType === "datetime") {
        const d = new Date(strVal);
        if (!isNaN(d)) {
          if (field.afterDatetime) {
            const ad = new Date(field.afterDatetime);
            if (!isNaN(ad) && d < ad) push(name, `Date/time must be after ${field.afterDatetime.replace("T", " ")}.`);
          }
          if (field.beforeDatetime) {
            const bd = new Date(field.beforeDatetime);
            if (!isNaN(bd) && d > bd) push(name, `Date/time must be before ${field.beforeDatetime.replace("T", " ")}.`);
          }
        } else if (strVal) {
          push(name, "Enter a valid date and time.");
        }
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

      if (field.fieldType === "file_upload") {
        if (!strVal && (field.required || dynamicRequiredFields.has(field.fieldName))) {
          push(name, "Please upload the required file.");
        }
      }
    });

    // Rule engine validation errors
    formRules.forEach(rule => {
      if (rule.action?.type === "VALIDATION_ERROR") {
        if (evaluateConditionNode(rule.condition, formData)) {
          const action = rule.action;
          const message = action.message || "Requirement not met.";
          
          if (action.scope === "FORM") {
             push("_FORM_ERROR_", message);
          } else {
            let target = action.targetField;
            if (!target && rule.condition?.conditions?.length > 0) {
              target = rule.condition.conditions[0].field;
            }
            if (target) {
              push(target, message);
            } else {
              push("_FORM_ERROR_", message);
            }
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
    const current = Array.isArray(formData[fieldName])
      ? formData[fieldName]
      : (formData[fieldName] || "").toString().split(",").map(v => v.trim()).filter(Boolean);

    // Use loose equality for comparison
    const updated = current.some(v => v == optionValue)
      ? current.filter((v) => v != optionValue)
      : [...current, optionValue];

    handleInputChange(fieldName, updated);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
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

    // Prepare data for submission: convert arrays (from Checkboxes) to comma-separated strings
    const submissionData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value.join(", ")];
        }
        return [key, value];
      })
    );

    try {
      const res = await apiClient.post(ENDPOINTS.SUBMISSIONS, { 
        formId: id, 
        versionId: formConfig.formVersionId, 
        values: submissionData 
      });

      if (res.data.success) {
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (user) {
          setTimeout(() => {
            router.push("/forms/all");
          }, 1200);
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors && Object.keys(errorData.errors).length > 0) {
        setErrors((prev) => ({ ...prev, ...errorData.errors }));
        
        if (errorData.errors["_FORM_ERROR_"]) {
          setErrors((prev) => ({ ...prev, _ruleError: errorData.errors["_FORM_ERROR_"] }));
        }
        
        const fieldError = Object.keys(errorData.errors).find(k => k !== "_FORM_ERROR_");
        if (fieldError) {
          const el = document.getElementById(`field-${fieldError}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setErrors((prev) => ({ ...prev, _ruleError: [err.message || "Submission failed"] }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (isQuiet = false) => {
    if (!formConfig || !user) return;
    setIsDraftSaving(true);
    if (!isQuiet) setDraftSaveMessage(null);

    const submissionData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value.join(", ")];
        }
        return [key, value];
      })
    );

    const activeVersionId = formConfig.formVersionId || null;

    try {
      const res = await apiClient.post(`${ENDPOINTS.SUBMISSIONS}/draft`, {
        formId: id,
        formVersionId: activeVersionId,
        data: submissionData
      });

      if (res.data.success) {
        setDraftSubmissionId(res.data.data.submissionId);
        setIsDirty(false);
        setLastSavedData(JSON.stringify(formData));
        if (!isQuiet) {
          setDraftSaveMessage({ type: "success", message: "Draft saved successfully" });
          setTimeout(() => setDraftSaveMessage(null), 3000);
        }
      }
    } catch (err) {
      if (!isQuiet) setDraftSaveMessage({ type: "error", message: err.message || "Failed to save draft" });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleResetForm = () => {
    // Reset all form related state
    const initialData = getInitialFormData(formConfig?.fields);
    setFormData(initialData);
    setErrors({});
    setCurrentPage(0);
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // If it's a group, we pass the computed child tree to the wrapper
    const fieldProps = {
      field: field,
      label: field.fieldName,

      // DATA & STATE
      value: formData[field.fieldKey || field.fieldName],
      formData: formData, // Global state for recursive children
      errors: errors[field.fieldKey || field.fieldName],
      allErrors: errors,   // Global errors for recursive children
      
      // LOGIC & VISIBILITY
      visibility: fieldVisibility[field.fieldKey || field.fieldName] || (showTargetFields.has(field.fieldKey || field.fieldName) ? "HIDE" : "SHOW"),
      allVisibility: fieldVisibility, // Global visibility for recursive children
      isShowControlled: showTargetFields.has(field.fieldKey || field.fieldName),
      allShowTargets: showTargetFields, // Global logic control for recursive children
      isRuleRequired: dynamicRequiredFields.has(field.fieldKey || field.fieldName),
      allDynamicRequired: dynamicRequiredFields, // Global required logic for recursive children

      // HANDLERS
      onChange: handleInputChange,
      onCheckboxChange: handleCheckboxChange,
    };

    // For groups, recursive children are handled by FormFieldWrapper internally
    return (
      <FormFieldWrapper key={field.id} {...fieldProps} />
    );
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-20 px-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-16 text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                <div className="relative w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/40 animate-in zoom-in duration-700">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Form Submitted</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight">Thank You</h1>
                <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                  Your data has been saved successfully. Thank you for your contribution to the {formConfig.formName}.
                </p>
              </div>

              <div className="pt-8">
                <button
                  onClick={handleResetForm}
                  className="group flex items-center gap-4 px-10 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-primary shadow-2xl shadow-primary/20 transition-all active:scale-95 mx-auto"
                >
                  <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
                  Submit Another Response
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Powered by Antigravity Design System</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-20 px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <Link href="/forms/all" className="group inline-flex items-center gap-3 text-slate-400 hover:text-primary mb-12 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:border-primary/20 group-hover:shadow-lg transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          Return to Hub
        </Link>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.03)] overflow-hidden">

          {/* Form Header Section */}
          <div className="p-10 md:p-16 border-b border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Send size={120} strokeWidth={1} />
            </div>

            <div className="relative space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Form Details</span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 leading-none tracking-tight">{formConfig.formName}</h1>

              {isMultiPage ? (
                <div className="space-y-6 pt-8">
                  {/* Phase Tracker */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3.5">Build your form</p>
                      <p className="text-xl font-black text-slate-800">
                        {currentPage + 1} <span className="text-slate-300 mx-1 font-medium">/</span> {totalPages}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 block">Progress</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-primary">{progressPct}%</span>
                        <div className="w-12 h-12 relative flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                            <defs>
                              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="var(--primary, #3b82f6)" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>
                            {/* Background Circle */}
                            <circle
                              cx="50" cy="50" r="42"
                              stroke="#f1f5f9" strokeWidth="8" fill="transparent"
                              className="transition-all duration-500"
                            />
                            {/* Progress Circle */}
                            <circle
                              cx="50" cy="50" r="42"
                              stroke="url(#progressGradient)" strokeWidth="8" fill="transparent"
                              strokeDasharray="264"
                              strokeDashoffset={264 - (264 * progressPct) / 100}
                              strokeLinecap="round"
                              style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))' }}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <CheckCircle2 size={16} className={`relative z-10 transition-all duration-500 ${progressPct === 100 ? "text-primary scale-110" : "text-slate-200"}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linear Progress */}
                  <div className="relative h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[15px] text-slate-500 font-medium pt-4 max-w-md leading-relaxed">System ready for your input. Please fill in the details below.</p>
              )}
            </div>
          </div>


          {/* Form Content Area */}
          <form onSubmit={isLastPage ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} noValidate
            className="p-10 md:p-16 space-y-16">

            {/* Draft Banners */}
            {draftBanner && (
              <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
                draftBanner.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-amber-50 border-amber-100 text-amber-800"
              }`}>
                {draftBanner.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-black uppercase tracking-wider">{draftBanner.message}</p>
                <button type="button" onClick={() => setDraftBanner(null)} className="ml-auto opacity-50 hover:opacity-100">
                  <RotateCcw size={16} />
                </button>
              </div>
            )}

            {draftSaveMessage && (
              <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in duration-300 ${
                draftSaveMessage.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${draftSaveMessage.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{draftSaveMessage.message}</p>
              </div>
            )}

            {/* Rule Engine Violation */}
            {(errors._ruleError || errors._FORM_ERROR_) && (
              <div className="rounded-[2.5rem] border-2 border-red-200 bg-white p-8 flex items-start gap-6 shadow-xl shadow-red-500/5">
                <div className="w-14 h-14 rounded-[1.5rem] bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0 animate-bounce">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Requirement Unmet</h3>
                  <p className="text-[15px] text-red-600/80 font-inter leading-relaxed">
                    {(errors._ruleError && errors._ruleError[0]) || (errors._FORM_ERROR_ && errors._FORM_ERROR_[0])}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-12">
              {currentPageFields.map(renderField)}
            </div>

            {/* Orchestration Controls */}
            <div className={`flex items-center gap-6 pt-12 ${currentPage > 0 ? "justify-between" : "justify-end"}`}>
              {currentPage > 0 && (
                <button type="button" onClick={handleBack}
                  className="group flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest border-2 border-slate-100 text-slate-400 hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all active:scale-95">
                  <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  Previous Step
                </button>
              )}

              {user && (
                <div className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100/50">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        {isDraftSaving ? (
                            <Loader2 size={12} className="text-emerald-500 animate-spin" />
                        ) : isDirty ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ) : (
                            <CheckCircle2 size={12} className="text-emerald-500" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            {isDraftSaving ? "Auto-saving..." : isDirty ? "Unsaved Changes" : "Progress Saved"}
                        </span>
                    </div>
                    {draftSaveMessage && (
                        <span className={`text-[9px] font-bold mt-0.5 ${draftSaveMessage.type === 'error' ? 'text-red-500' : 'text-emerald-400'}`}>
                            {draftSaveMessage.message}
                        </span>
                    )}
                  </div>
                  
                  <button type="button" onClick={() => handleSaveDraft(false)} disabled={isDraftSaving || !isDirty}
                    className="ml-2 flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-emerald-500">
                    <RotateCcw size={14} className={isDraftSaving ? "animate-spin" : ""} />
                  </button>
                </div>
              )}

              {isLastPage ? (
                <button type="submit" disabled={isSubmitting}
                  className={`flex-1 h-20 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${isSubmitting
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-95"
                    }`}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </button>
              ) : (
                <button type="submit"
                  className="flex-1 h-20 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 bg-slate-900 text-white hover:bg-primary shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95">
                  Next Step <ChevronRight size={24} className="animate-bounce-x" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Support footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Powered by Antigravity Design System</p>
        </div>
      </div>
    </div>
  );
}