"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // ✅ Added useRouter
import { AlertCircle, Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PublicFormPage() {
  const { id } = useParams();
  const router = useRouter(); // ✅ Initialize router
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:9090/api/forms/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Form not found");
        return res.json();
      })
      .then(async (data) => {
        if (data?.fields) {
           await Promise.all(data.fields.map(async (field) => {
               if (field.fieldType === 'select' && field.sourceTable && field.sourceColumn) {
                   try {
                       const optRes = await fetch(`http://localhost:9090/api/forms/${field.sourceTable}/lookup/${field.sourceColumn}`);
                       if (optRes.ok) {
                           field.options = await optRes.json();
                       }
                   } catch (err) {
                       console.error("Failed to fetch dynamic options for", field.fieldName, err);
                   }
               }
           }));
        }

        setFormConfig(data);
        const initialData = {};
        if (data?.fields) {
          data.fields.forEach((field) => {
            initialData[field.fieldName] = field.fieldType === "checkbox" ? [] : "";
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

  const validate = () => {
    const newErrors = {};
    if (!formConfig || !formConfig.fields) return newErrors;

    formConfig.fields.forEach((field) => {
      const value = formData[field.fieldName];
      const name = field.fieldName;

      if (field.required) {
        if (field.fieldType === "checkbox") {
          if (!value || value.length === 0) newErrors[name] = `Select at least one option`;
        } else if (!value || value.toString().trim() === "") {
          newErrors[name] = `${name} is required`;
        }
      }

      const isStringField = ["text", "email", "textarea"].includes(field.fieldType);
      if (value && isStringField) {
        if (field.minLength && value.length < field.minLength) {
          newErrors[name] = `Min ${field.minLength} characters required`;
        }
        if (field.maxLength && value.length > field.maxLength) {
          newErrors[name] = `Max ${field.maxLength} characters allowed`;
        }
      }

      if (value && field.fieldType === "number") {
        const numVal = Number(value);
        if (field.min !== null && numVal < field.min) newErrors[name] = `Min value: ${field.min}`;
        if (field.max !== null && numVal > field.max) newErrors[name] = `Max value: ${field.max}`;
      }

      if (value && field.fieldType === "date") {
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);
        if (field.afterDate && selectedDate < new Date(field.afterDate).setHours(0,0,0,0)) {
            newErrors[name] = `Must be after ${field.afterDate}`;
        }
        if (field.beforeDate && selectedDate > new Date(field.beforeDate).setHours(0,0,0,0)) {
            newErrors[name] = `Must be before ${field.beforeDate}`;
        }
      }
    });

    return newErrors;
  };

  const handleCheckboxChange = (fieldName, optionValue) => {
    const currentValues = formData[fieldName] || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v) => v !== optionValue)
      : [...currentValues, optionValue];
    
    handleInputChange(fieldName, newValues);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[fieldName];
        return newErrs;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formConfig) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors); 
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const submissionBody = {
      formId: parseInt(id),
      values: formData,
    };

    try {
      const res = await fetch(`http://localhost:9090/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionBody),
      });

      if (res.ok) {
        // ✅ Redirect to the Data view page after successful submission
        router.push(`/forms/data/${id}`);
      } else {
        const errorMsg = await res.text();
        alert(`Error: ${errorMsg || "Submission failed"}`);
      }
    } catch (err) {
      alert("Connection failed. Check backend/CORS settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Form...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 font-bold text-sm uppercase tracking-widest">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-4xl font-black text-slate-900 capitalize mb-2">{formConfig.formName}</h1>
            <p className="text-slate-500 font-medium">Please fill the details below.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            {formConfig?.fields?.map((field) => (
              <div key={field.id} className="space-y-4">
                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                  {field.fieldName} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.fieldType === "textarea" && (
                  <textarea
                    rows={4}
                    value={formData[field.fieldName] || ""}
                    onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium resize-none ${errors[field.fieldName] ? "border-red-300 bg-red-50/30" : "border-slate-200 focus:border-blue-500 bg-slate-50/30"}`}
                  />
                )}

                {field.fieldType === "radio" && (
                  <div className="grid gap-3">
                    {field.options?.map((opt, idx) => (
                      <label key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData[field.fieldName] === opt ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50/50 border-slate-100 text-slate-600"}`}>
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

                {field.fieldType === "checkbox" && (
                  <div className="grid gap-3">
                    {field.options?.map((opt, idx) => (
                      <label key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData[field.fieldName]?.includes(opt) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50/50 border-slate-100 text-slate-600"}`}>
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

                {field.fieldType === "select" && (
                  <div className="relative">
                    <select
                      value={formData[field.fieldName] || ""}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none font-bold appearance-none cursor-pointer ${errors[field.fieldName] ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100" : "border-slate-200 hover:border-blue-400 focus:border-blue-500 bg-slate-50/30 focus:ring-4 focus:ring-blue-100 text-slate-800"}`}
                    >
                      <option value="" disabled>Select an option</option>
                      {field.options?.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                )}

                {!["textarea", "radio", "checkbox", "select"].includes(field.fieldType) && (
                  <input
                    type={field.fieldType}
                    value={formData[field.fieldName] || ""}
                    onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                    className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium ${errors[field.fieldName] ? "border-red-300 bg-red-50/30" : "border-slate-200 focus:border-blue-500 bg-slate-50/30"}`}
                  />
                )}

                {errors[field.fieldName] && (
                  <div className="flex items-center gap-1.5 text-red-500 px-2 font-bold text-xs uppercase tracking-tight">
                    <AlertCircle size={14} /> {errors[field.fieldName]}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mt-6 ${isSubmitting ? "bg-slate-300" : "bg-slate-900 text-white hover:bg-blue-600 shadow-xl"}`}
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