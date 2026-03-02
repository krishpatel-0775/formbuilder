"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"; // Optional: npm install lucide-react

export default function FillFormPage() {
  const { id } = useParams();

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id || !mounted) return;

    fetch(`http://localhost:9090/api/forms/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching form:", err);
        setLoading(false);
      });
  }, [id, mounted]);

  const handleChange = (fieldName, value, fieldType) => {
    let parsedValue = value;
    if (fieldType === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }
    setValues((prev) => ({
      ...prev,
      [fieldName]: parsedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;

    const payload = {
      formId: form.id,
      values: values,
    };

    try {
      const response = await fetch("http://localhost:9090/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      let result = contentType && contentType.includes("application/json") 
        ? await response.json() 
        : await response.text();

      if (!response.ok) {
        alert(typeof result === "string" ? result : result.message || "Submission failed");
        return;
      }

      setIsSubmitted(true);
      setValues({});
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong!");
    }
  };

  if (!mounted) return null;

  // --- UI COMPONENTS ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your form...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-500 font-semibold text-xl">Form not found</p>
        <p className="text-slate-500">The link might be broken or the form was deleted.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-500 mb-8">Your response for <span className="font-semibold">{form.formName}</span> has been recorded.</p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="text-indigo-600 font-medium hover:underline"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 md:p-12">
      {/* Form Card */}
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Accent Header */}
        <div className="h-3 w-full bg-indigo-600" />
        
        <div className="p-8 md:p-12">
          <header className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {form.formName}
            </h1>
            <p className="text-slate-500">Please fill out the details below carefully.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {form.fields.map((field, index) => {
              const inputClasses =
                "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/30 text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 placeholder:text-slate-400";

              const fieldName = field.fieldName;
              const fieldType = field.fieldType;

              return (
                <div key={`${field.id}-${index}`} className="group space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex items-center">
                    {fieldName}
                    {field.required && <span className="text-red-500 ml-1 text-lg leading-none">*</span>}
                  </label>

                  {/* Render Inputs based on type */}
                  <div className="relative">
                    {fieldType === "text" && (
                      <input
                        type="text"
                        placeholder={`Enter ${fieldName.toLowerCase()}`}
                        className={inputClasses}
                        value={values[fieldName] || ""}
                        onChange={(e) => handleChange(fieldName, e.target.value, fieldType)}
                        required={field.required}
                        minLength={field.minLength ?? undefined}
                        maxLength={field.maxLength ?? undefined}
                      />
                    )}

                    {fieldType === "email" && (
                      <input
                        type="email"
                        placeholder="example@domain.com"
                        className={inputClasses}
                        value={values[fieldName] || ""}
                        onChange={(e) => handleChange(fieldName, e.target.value, fieldType)}
                        required={field.required}
                        // pattern={field.pattern ?? undefined}
                      />
                    )}

                    {fieldType === "number" && (
                      <input
                        type="number"
                        placeholder="0"
                        className={inputClasses}
                        value={values[fieldName] || ""}
                        onChange={(e) => handleChange(fieldName, e.target.value, fieldType)}
                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                        required={field.required}
                        min={field.min ?? undefined}
                        max={field.max ?? undefined}
                      />
                    )}

                    {fieldType === "date" && (
                      <input
                        type="date"
                        className={inputClasses}
                        value={values[fieldName] || ""}
                        onChange={(e) => handleChange(fieldName, e.target.value, fieldType)}
                        required={field.required}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Submit Response
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                Securely powered by FormBuilder
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}