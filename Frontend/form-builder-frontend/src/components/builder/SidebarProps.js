import { SlidersHorizontal, AlertCircle, Trash2 } from "lucide-react";

export function DefaultValuePanel({ activeField, updateField }) {
  const textTypes = ["text", "email", "url", "phone", "number"];
  const base = "w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 shadow-sm";

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <SlidersHorizontal size={14} /> Default Value
      </label>

      {textTypes.includes(activeField.type) && (
        <input type={activeField.type === "number" ? "number" : "text"} placeholder="Pre-filled value..."
          value={activeField.defaultValue ?? ""} onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={base} />
      )}

      {activeField.type === "textarea" && (
        <textarea rows={3} placeholder="Pre-filled value..." value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={`${base} resize-none`} />
      )}

      {activeField.type === "date" && (
        <input type="date" value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)} className={base} />
      )}

      {activeField.type === "time" && (
        <input type="time" value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)} className={base} />
      )}

      {(activeField.type === "radio" || activeField.type === "select") &&
        !activeField.sourceTable && activeField.options?.length > 0 && (
          <select value={activeField.defaultValue ?? ""}
            onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)} className={base}>
            <option value="">None (no default)</option>
            {activeField.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        )}

      {activeField.type === "toggle" && (
        <div onClick={() => updateField(activeField.id, "defaultValue", activeField.defaultValue === "true" ? "false" : "true")}
          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${activeField.defaultValue === "true" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
          <span className="text-xs font-bold">Default: {activeField.defaultValue === "true" ? "Checked" : "Unchecked"}</span>
          <div className={`w-8 h-4 rounded-full transition-colors relative ${activeField.defaultValue === "true" ? "bg-emerald-500" : "bg-slate-300"}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${activeField.defaultValue === "true" ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarProps({ 
  activeField, 
  updateField, 
  handleNumberInput, 
  availableForms, 
  selectedFormFields 
}) {
  return (
    <div className="p-6 space-y-8 overflow-y-auto flex-1">
      {/* Required Toggle */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Behavior</label>
        <div onClick={() => updateField(activeField.id, "required", !activeField.required)}
          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${activeField.required ? "bg-violet-50 border-violet-200 text-violet-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
          <span className="text-sm font-bold">Required Field</span>
          <div className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${activeField.required ? "bg-violet-600" : "bg-slate-300"}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${activeField.required ? "translate-x-6" : "translate-x-1"}`} />
          </div>
        </div>
      </div>

      {/* Default Value */}
      <DefaultValuePanel activeField={activeField} updateField={updateField} />

      {/* Constraints */}
      <div className="space-y-6">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={14} /> Constraints
        </label>

        {(activeField.type === "text" || activeField.type === "textarea") && (
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Character Range</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Min</span>
                  <input type="number" value={activeField.minLength} onChange={(e) => handleNumberInput(e, activeField.id, "minLength")} placeholder="0"
                    className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
                <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                  <input type="number" value={activeField.maxLength} onChange={(e) => handleNumberInput(e, activeField.id, "maxLength")} placeholder="0"
                    className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
              </div>
            </div>
            {activeField.type === "text" && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Regex Pattern</span>
                <input type="text" placeholder="e.g. ^[A-Z]+$" value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                  className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-violet-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
              </div>
            )}
          </div>
        )}

        {(activeField.type === "radio" || activeField.type === "checkbox" || activeField.type === "select") && (
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">
              {activeField.type === "select" ? "Data Source Options" : "Choices"}
            </span>
            {activeField.type === "select" && (
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button onClick={() => { updateField(activeField.id, "sourceTable", ""); updateField(activeField.id, "sourceColumn", ""); }}
                  className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-colors ${!activeField.sourceTable ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Manual List</button>
                <button onClick={() => { if (!activeField.sourceTable && availableForms.length > 0) updateField(activeField.id, "sourceTable", availableForms[0].id.toString()); }}
                  className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-colors ${activeField.sourceTable ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Other Form Data</button>
              </div>
            )}
            {!activeField.sourceTable ? (
              <div className="space-y-3 mt-2">
                {activeField.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={opt} onChange={(e) => { const n = [...activeField.options]; n[i] = e.target.value; updateField(activeField.id, "options", n); }}
                      className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
                    <button onClick={() => { const n = activeField.options.filter((_, idx) => idx !== i); updateField(activeField.id, "options", n); }}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => updateField(activeField.id, "options", [...(activeField.options || []), `Option ${(activeField.options?.length || 0) + 1}`])}
                  className="w-full p-3 border border-dashed border-violet-300 rounded-xl text-violet-600 font-bold hover:bg-violet-50 text-sm transition-colors mt-2">+ Add Choice</button>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Source Form</label>
                  <select value={activeField.sourceTable || ""} onChange={(e) => { updateField(activeField.id, "sourceTable", e.target.value); updateField(activeField.id, "sourceColumn", ""); }}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm">
                    <option value="" disabled>Select a form...</option>
                    {availableForms.map((f) => <option key={f.id} value={f.id.toString()}>{f.formName}</option>)}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Data Column (Target)</label>
                  <select value={activeField.sourceColumn || ""} onChange={(e) => updateField(activeField.id, "sourceColumn", e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" disabled={!activeField.sourceTable}>
                    <option value="" disabled>Select a column to use...</option>
                    {selectedFormFields.map((f) => <option key={f.fieldName} value={f.fieldName}>{f.fieldName} ({f.fieldType})</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {activeField.type === "number" && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Value Range</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Min</span>
                <input type="number" value={activeField.min} onChange={(e) => handleNumberInput(e, activeField.id, "min")} placeholder="0"
                  className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
              <div className="relative"><span className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Max</span>
                <input type="number" value={activeField.max} onChange={(e) => handleNumberInput(e, activeField.id, "max")} placeholder="0"
                  className="w-full bg-white border border-slate-200 pt-7 pb-3 px-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
            </div>
          </div>
        )}

        {activeField.type === "email" && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Validation Regex</span>
            <input type="text" placeholder="Custom pattern..." value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
              className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-violet-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
          </div>
        )}

        {activeField.type === "date" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Date Range Limitations</span>
            <div className="flex flex-col gap-3">
              <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">After Date</span>
                <input type="date" value={activeField.afterDate} onChange={(e) => updateField(activeField.id, "afterDate", e.target.value)}
                  className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
              <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Date</span>
                <input type="date" value={activeField.beforeDate} onChange={(e) => updateField(activeField.id, "beforeDate", e.target.value)}
                  className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
            </div>
          </div>
        )}

        {activeField.type === "phone" && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Regex Pattern (optional)</span>
            <input type="text" placeholder="e.g. ^\+91[0-9]{10}$" value={activeField.pattern} onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
              className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-mono text-violet-600 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 shadow-sm" />
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[11px] text-slate-500 font-medium">Leave empty to use default validation (7–15 digits).</p>
            </div>
          </div>
        )}

        {activeField.type === "time" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Time Range</span>
            <div className="flex flex-col gap-3">
              <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">After Time</span>
                <input type="time" value={activeField.afterTime ?? ""} onChange={(e) => updateField(activeField.id, "afterTime", e.target.value)}
                  className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
              <div className="relative"><span className="absolute left-3 top-2 text-[10px] text-slate-400 font-bold uppercase">Before Time</span>
                <input type="time" value={activeField.beforeTime ?? ""} onChange={(e) => updateField(activeField.id, "beforeTime", e.target.value)}
                  className="w-full bg-white border border-slate-200 pt-6 pb-2 px-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" /></div>
            </div>
          </div>
        )}

        {activeField.type === "url" && (
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide uppercase">Validation Info</span>
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
              <p className="text-xs font-bold text-violet-700">Auto-validated</p>
              <p className="text-[11px] text-violet-500 mt-1 font-medium leading-relaxed">
                URL must start with <code className="bg-violet-100 px-1 rounded">http://</code> or <code className="bg-violet-100 px-1 rounded">https://</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
