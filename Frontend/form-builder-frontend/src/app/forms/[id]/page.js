"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ENDPOINTS } from "../../../config/apiConfig";

export default function PublicFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  // errors shape: { fieldName: string[] }  — multiple messages per field
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${ENDPOINTS.FORMS}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Form not found");
        return res.json();
      })
      .then(async (res) => {
        const data = res.data;

        // Fetch dynamic dropdown options
        if (data?.fields) {
          await Promise.all(
            data.fields.map(async (field) => {
              if (
                field.fieldType === "select" &&
                field.sourceTable &&
                field.sourceColumn
              ) {
                try {
                  const optRes = await fetch(
                    `${ENDPOINTS.FORMS}/${field.sourceTable}/lookup/${field.sourceColumn}`
                  );
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

        setFormConfig(data);

        // Pre-fill from defaultValue
        const initialData = {};
        if (data?.fields) {
          data.fields.forEach((field) => {
            if (field.fieldType === "checkbox") {
              initialData[field.fieldName] = field.defaultValue
                ? field.defaultValue.split(",").map((v) => v.trim()).filter(Boolean)
                : [];
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

  // ─────────────────────────────────────────────────────────────────────────────
  // validate() — collects EVERY violation for EVERY field into string[]
  // Returns: { fieldName: string[] }
  // ─────────────────────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {}; // { fieldName: string[] }

    const push = (name, msg) => {
      if (!newErrors[name]) newErrors[name] = [];
      newErrors[name].push(msg);
    };

    if (!formConfig?.fields) return newErrors;

    formConfig.fields.forEach((field) => {
      const value = formData[field.fieldName];
      const name = field.fieldName;

      // ── 1. Required ─────────────────────────────────────────────────────────
      if (field.required) {
        if (field.fieldType === "checkbox") {
          if (!value || value.length === 0)
            push(name, "Please select at least one option.");
        } else if (!value || value.toString().trim() === "") {
          push(name, `This field is required.`);
        }
      }

      // Skip remaining checks when there is no value at all
      const strVal = value?.toString().trim() ?? "";
      if (!strVal && field.fieldType !== "checkbox") return;
      if (field.fieldType === "checkbox" && (!value || value.length === 0)) return;

      // ── 2. String length — text, textarea, email, phone, url ────────────────
      const isStringField = ["text", "email", "textarea", "phone", "url"].includes(field.fieldType);
      if (isStringField) {
        if (field.minLength && strVal.length < Number(field.minLength))
          push(name, `Minimum ${field.minLength} characters required (you entered ${strVal.length}).`);
        if (field.maxLength && strVal.length > Number(field.maxLength))
          push(name, `Maximum ${field.maxLength} characters allowed (you entered ${strVal.length}).`);
      }

      // ── 3. Regex / Pattern ──────────────────────────────────────────────────
      if (field.pattern && ["text", "email"].includes(field.fieldType)) {
        try {
          if (!new RegExp(field.pattern).test(strVal))
            push(name, `Value does not match the required format (${field.pattern}).`);
        } catch (_) {
          // ignore invalid regex in builder
        }
      }

      // ── 4. Email format ─────────────────────────────────────────────────────
      if (field.fieldType === "email" && !field.pattern) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal))
          push(name, "Enter a valid email address (e.g. user@example.com).");
      }

      // ── 5. Number range ─────────────────────────────────────────────────────
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

      // ── 6. Date range ────────────────────────────────────────────────────────
      if (field.fieldType === "date") {
        const selected = new Date(strVal);
        if (isNaN(selected)) {
          push(name, "Enter a valid date.");
        } else {
          selected.setHours(0, 0, 0, 0);
          if (field.afterDate) {
            const after = new Date(field.afterDate);
            after.setHours(0, 0, 0, 0);
            if (selected < after)
              push(name, `Date must be after ${field.afterDate}.`);
          }
          if (field.beforeDate) {
            const before = new Date(field.beforeDate);
            before.setHours(0, 0, 0, 0);
            if (selected > before)
              push(name, `Date must be before ${field.beforeDate}.`);
          }
        }
      }

      // ── 7. Time range ────────────────────────────────────────────────────────
      if (field.fieldType === "time") {
        if (field.afterTime && strVal < field.afterTime)
          push(name, `Time must be after ${field.afterTime}.`);
        if (field.beforeTime && strVal > field.beforeTime)
          push(name, `Time must be before ${field.beforeTime}.`);
      }

      // ── 8. Phone ─────────────────────────────────────────────────────────────
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

      // ── 9. URL ───────────────────────────────────────────────────────────────
      // if (field.fieldType === "url") {
      //   if (!/^(https?:\/\/)[\w\-]+(\.[\w\-]+)+/.test(strVal))
      //     push(name, "Must be a valid URL starting with http:// or https://.");
      // }
    });

    return newErrors;
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
    // Clear errors for this field as user edits
    if (errors[fieldName]) {
      setErrors((prev) => { const n = { ...prev }; delete n[fieldName]; return n; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formConfig) return;

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Auto-scroll to the first field with an error
      const firstKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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
          alert(`Error: ${errorData.message || "Submission failed"}`);
        } catch (e) {
          alert(`Error: ${errorText || "Submission failed"}`);
        }
      }
    } catch (err) {
      alert("Connection failed. Check backend/CORS settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading / not found states ──────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Loading Form...
        </p>
      </div>
    );

  if (!formConfig)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold">Form not found.</p>
      </div>
    );

  const totalErrors = Object.values(errors).reduce((acc, msgs) => acc + msgs.length, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">

          {/* Form header */}
          <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-4xl font-black text-slate-900 capitalize mb-2">
              {formConfig.formName}
            </h1>
            <p className="text-slate-500 font-medium">
              Please fill the details below.
            </p>
          </div>

          {/* ── Global error summary banner ─────────────────────────────────── */}
          {totalErrors > 0 && (
            <div className="mx-8 md:mx-12 mt-8 rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-red-100/60 border-b border-red-200">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-black text-red-700 uppercase tracking-wide">
                  {totalErrors} error{totalErrors > 1 ? "s" : ""} — please fix before submitting
                </p>
              </div>
              <ul className="px-5 py-4 space-y-1.5">
                {Object.entries(errors).map(([fieldName, msgs]) =>
                  msgs.map((msg, i) => (
                    <li key={`${fieldName}-${i}`} className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`field-${fieldName}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline text-left"
                      >
                        <span className="text-red-400 uppercase">{fieldName}:</span> {msg}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* ── Form fields ─────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="p-8 md:p-12 space-y-10">
            {formConfig?.fields?.map((field) => {
              const fieldErrors = errors[field.fieldName]; // string[] | undefined
              const hasError = fieldErrors && fieldErrors.length > 0;

              return (
                <div
                  key={field.id}
                  id={`field-${field.fieldName}`}
                  className="space-y-3"
                >
                  {/* Label */}
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                    {field.fieldName}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {/* TEXTAREA */}
                  {field.fieldType === "textarea" && (
                    <textarea
                      rows={4}
                      value={formData[field.fieldName] || ""}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium resize-none ${hasError
                        ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-slate-50/30"
                        }`}
                    />
                  )}

                  {/* RADIO */}
                  {field.fieldType === "radio" && (
                    <div className="grid gap-3">
                      {field.options?.map((opt, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData[field.fieldName] === opt
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : hasError
                              ? "bg-red-50/20 border-red-200 text-slate-600"
                              : "bg-slate-50/50 border-slate-100 text-slate-600"
                            }`}
                        >
                          <input
                            type="radio"
                            name={field.fieldName}
                            value={opt}
                            checked={formData[field.fieldName] === opt}
                            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="font-bold">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* CHECKBOX */}
                  {field.fieldType === "checkbox" && (
                    <div className="grid gap-3">
                      {field.options?.map((opt, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData[field.fieldName]?.includes(opt)
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : hasError
                              ? "bg-red-50/20 border-red-200 text-slate-600"
                              : "bg-slate-50/50 border-slate-100 text-slate-600"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData[field.fieldName]?.includes(opt)}
                            onChange={() => handleCheckboxChange(field.fieldName, opt)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span className="font-bold">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* SELECT */}
                  {field.fieldType === "select" && (
                    <div className="relative">
                      <select
                        value={formData[field.fieldName] || ""}
                        onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                        className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none font-bold appearance-none cursor-pointer ${hasError
                          ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                          : "border-slate-200 hover:border-blue-400 focus:border-blue-500 bg-slate-50/30 focus:ring-4 focus:ring-blue-100 text-slate-800"
                          }`}
                      >
                        <option value="" disabled>Select an option</option>
                        {field.options?.map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* TEXT / NUMBER / EMAIL / DATE / PHONE / TIME / URL */}
                  {!["textarea", "radio", "checkbox", "select"].includes(field.fieldType) && (
                    <input
                      type={field.fieldType === "phone" ? "tel" : field.fieldType}
                      value={formData[field.fieldName] || ""}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium ${hasError
                        ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-slate-50/30"
                        }`}
                    />
                  )}

                  {/* ── Inline error list — ALL violations shown together ─────── */}
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
                </div>
              );
            })}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mt-6 ${isSubmitting
                ? "bg-slate-300 cursor-not-allowed text-slate-500"
                : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl hover:shadow-blue-600/20 active:scale-[0.99]"
                }`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {isSubmitting ? "Processing..." : "Submit Response"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}