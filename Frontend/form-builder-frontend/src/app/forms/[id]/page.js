"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Calendar, Mail, Type, Hash, ArrowRight, ShieldCheck } from "lucide-react";

export default function FillFormPage() {
  const { id } = useParams();

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
    setValues((prev) => ({ ...prev, [fieldName]: parsedValue }));
    setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("http://localhost:9090/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: form.id, values }),
      });

      const contentType = response.headers.get("content-type");
      let result = contentType && contentType.includes("application/json")
          ? await response.json()
          : await response.text();

      if (!response.ok) {
        const message = typeof result === "string" ? result : result.error || "Submission failed";
        setErrorMessage(message);
        const fieldName = message.split(" ")[0];
        setFieldErrors({ [fieldName]: message });
        return;
      }
      setIsSubmitted(true);
      setValues({});
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10 text-center border border-slate-200">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Success!</h1>
          <p className="text-slate-600 mb-8 font-medium">Your data has been securely recorded.</p>
          <button onClick={() => setIsSubmitted(false)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-all">
            Submit New Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      {/* Wider card to utilize screen space */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden">
        
        {/* High Contrast Header */}
        <div className="px-10 py-8 bg-white border-b-2 border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600 w-7 h-7" />
              {form?.formName}
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Data Entry Terminal</p>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-tighter">ID: {id?.toString().slice(-6)}</span>
          </div>
        </div>

        <div className="p-10">
          {errorMessage && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-black flex items-center gap-3">
              <AlertCircle size={18} /> {errorMessage.toUpperCase()}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {form?.fields.map((field, index) => {
              const fieldName = field.fieldName;
              const hasError = fieldErrors[fieldName];
              const icons = { 
                text: <Type size={18} />, 
                email: <Mail size={18} />, 
                number: <Hash size={18} />, 
                date: <Calendar size={18} /> 
              };

              return (
                <div key={`${field.id}-${index}`} className="group space-y-2">
                  <div className="flex justify-between items-center px-1">
                    {/* Darker Label for Visibility */}
                    <label className="text-[13px] font-black text-slate-800 uppercase tracking-wider group-focus-within:text-indigo-700 transition-colors">
                      {fieldName} {field.required && <span className="text-red-600 text-lg">*</span>}
                    </label>
                  </div>

                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${hasError ? "text-red-600" : "text-slate-500 group-focus-within:text-indigo-600"}`}>
                      {icons[field.fieldType] || <Type size={18} />}
                    </div>

                    <input
                      type={field.fieldType}
                      className={`w-full pl-12 pr-4 py-3.5 text-base font-semibold rounded-xl border-2 transition-all outline-none leading-relaxed ${
                        hasError 
                        ? "border-red-400 bg-red-50 text-red-900 placeholder:text-red-300" 
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                      }`}
                      placeholder={`Enter ${fieldName.toLowerCase()}...`}
                      value={values[fieldName] || ""}
                      onChange={(e) => handleChange(fieldName, e.target.value, field.fieldType)}
                      required={field.required}
                    />
                  </div>

                  {hasError && (
                    <p className="text-xs font-black text-red-600 ml-1 flex items-center gap-1 uppercase tracking-tight">
                      <AlertCircle size={14} /> {fieldErrors[fieldName]}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Bottom Action Section */}
            <div className="pt-10 border-t-2 border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em]">Ready for secure upload</p>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-12 py-4 rounded-xl font-black text-base hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200"
              >
                SUBMIT DATA
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}