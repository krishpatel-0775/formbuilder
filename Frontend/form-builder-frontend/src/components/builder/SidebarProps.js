import { SlidersHorizontal, AlertCircle, Trash2, ChevronRight, Plus, Database, ListCircle, Code2, CheckCircle2 } from "lucide-react";

export function DefaultValuePanel({ activeField, updateField }) {
  const textTypes = ["text", "email", "url", "phone", "number"];
  const base = "w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-300 shadow-sm";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <SlidersHorizontal size={14} className="text-primary" />
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Default Value</label>
      </div>

      {textTypes.includes(activeField.type) && (
        <input
          type={activeField.type === "number" ? "number" : "text"}
          placeholder="Pre-set architectural value..."
          value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={base}
        />
      )}

      {activeField.type === "textarea" && (
        <textarea
          rows={3}
          placeholder="Pre-set narrative value..."
          value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={`${base} resize-none`}
        />
      )}

      {activeField.type === "date" && (
        <input
          type="date"
          value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={base}
        />
      )}

      {activeField.type === "time" && (
        <input
          type="time"
          value={activeField.defaultValue ?? ""}
          onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
          className={base}
        />
      )}

      {(activeField.type === "radio" || activeField.type === "select") &&
        !activeField.sourceTable && activeField.options?.length > 0 && (
          <select
            value={activeField.defaultValue ?? ""}
            onChange={(e) => updateField(activeField.id, "defaultValue", e.target.value)}
            className={base}
          >
            <option value="">None (Empty Initial State)</option>
            {activeField.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        )}

      {activeField.type === "checkbox" && !activeField.sourceTable && activeField.options?.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {activeField.options.map((opt, i) => {
            const currentVals = (activeField.defaultValue || "").split(",").map(v => v.trim()).filter(Boolean);
            const isSelected = currentVals.includes(opt);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const updated = isSelected
                    ? currentVals.filter(v => v !== opt)
                    : [...currentVals, opt];
                  updateField(activeField.id, "defaultValue", updated.join(", "));
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${isSelected
                    ? "bg-primary/5 border-primary text-primary shadow-md"
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                  }`}
              >
                <span className="text-xs font-black uppercase tracking-wider">{opt}</span>
                {isSelected && <CheckCircle2 size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
              </button>
            );
          })}
        </div>
      )}

      {activeField.type === "toggle" && (
        <div
          onClick={() => updateField(activeField.id, "defaultValue", activeField.defaultValue === "true" ? "false" : "true")}
          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all duration-500 ${activeField.defaultValue === "true"
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 shadow-lg shadow-emerald-500/5"
              : "bg-slate-50 border-slate-100 text-slate-500"
            }`}
        >
          <span className="text-[11px] font-black uppercase tracking-wider">
            Mode: {activeField.defaultValue === "true" ? "Active" : "Inactive"}
          </span>
          <div className={`w-10 h-5 rounded-full transition-all relative ${activeField.defaultValue === "true" ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-slate-200"
            }`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${activeField.defaultValue === "true" ? "translate-x-6 scale-110" : "translate-x-1"
              }`} />
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
  const badgeBase = "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border shadow-sm";
  const inputBase = "w-full bg-slate-50 border border-slate-100 pt-7 pb-3 px-4 rounded-2xl text-[13px] font-black text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm";

  return (
    <div className="space-y-10 pb-10">
      {/* Required Toggle */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Integrity Control</label>
        <div
          onClick={() => updateField(activeField.id, "required", !activeField.required)}
          className={`flex items-center justify-between p-5 rounded-[2rem] cursor-pointer border transition-all duration-500 ${activeField.required
              ? "bg-primary/5 border-primary shadow-xl shadow-primary/5 text-primary"
              : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeField.required ? "bg-primary text-white" : "bg-white text-slate-300 border border-slate-100"
              }`}>
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Mandatory Input</span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-all relative ${activeField.required ? "bg-primary shadow-lg shadow-primary/30" : "bg-slate-200"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-sm ${activeField.required ? "translate-x-7 scale-110" : "translate-x-1"}`} />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-100" />

      {/* Default Value */}
      <DefaultValuePanel activeField={activeField} updateField={updateField} />

      <div className="w-full h-px bg-slate-100" />

      {/* Constraints */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 px-1">
          <SlidersHorizontal size={14} className="text-primary" />
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Boundary Settings</label>
        </div>

        {["text", "textarea", "email", "phone", "url"].includes(activeField.type) && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">Min Chars</span>
                <input
                  type="number"
                  value={activeField.minLength}
                  onChange={(e) => handleNumberInput(e, activeField.id, "minLength")}
                  placeholder="0"
                  className={inputBase}
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10">Max Chars</span>
                <input
                  type="number"
                  value={activeField.maxLength}
                  onChange={(e) => handleNumberInput(e, activeField.id, "maxLength")}
                  placeholder="∞"
                  className={inputBase}
                />
              </div>
            </div>

            {["text", "email", "phone", "url"].includes(activeField.type) && (
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase px-1">Regex Pattern validation</span>
                <input
                  type="text"
                  placeholder="e.g. ^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"
                  value={activeField.pattern}
                  onChange={(e) => updateField(activeField.id, "pattern", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[13px] font-mono text-primary outline-none focus:bg-white focus:border-primary transition-all shadow-sm"
                />
              </div>
            )}
          </div>
        )}

        {(activeField.type === "radio" || activeField.type === "checkbox" || activeField.type === "select") && (
          <div className="space-y-6">
            <div className="flex p-1.5 bg-slate-100/50 rounded-2xl">
              <button
                onClick={() => { updateField(activeField.id, "sourceTable", ""); updateField(activeField.id, "sourceColumn", ""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!activeField.sourceTable
                    ? "bg-white text-slate-900 shadow-xl shadow-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <SlidersHorizontal size={14} /> Manual
              </button>
              <button
                onClick={() => { if (!activeField.sourceTable && availableForms.length > 0) updateField(activeField.id, "sourceTable", availableForms[0].id.toString()); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeField.sourceTable
                    ? "bg-primary text-white shadow-xl shadow-primary/20"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <Database size={14} /> Dynamic
              </button>
            </div>

            {!activeField.sourceTable ? (
              <div className="space-y-3">
                {activeField.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => { const n = [...activeField.options]; n[i] = e.target.value; updateField(activeField.id, "options", n); }}
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[13px] font-black text-slate-800 outline-none focus:bg-white focus:border-primary transition-all shadow-sm"
                      />
                    </div>
                    <button
                      onClick={() => { const n = activeField.options.filter((_, idx) => idx !== i); updateField(activeField.id, "options", n); }}
                      className="w-12 h-12 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateField(activeField.id, "options", [...(activeField.options || []), `Option ${(activeField.options?.length || 0) + 1}`])}
                  className="w-full p-4 border-2 border-dashed border-primary/20 rounded-2xl text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Architectural Choice
                </button>
              </div>
            ) : (
              <div className="space-y-6 bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-primary/60 ml-1">Data Reservoir (Source Form)</label>
                  <select
                    value={activeField.sourceTable || ""}
                    onChange={(e) => { updateField(activeField.id, "sourceTable", e.target.value); updateField(activeField.id, "sourceColumn", ""); }}
                    className="w-full bg-white border border-primary/10 p-4 rounded-2xl text-[13px] font-black text-slate-800 outline-none focus:border-primary transition-all shadow-xl shadow-primary/5"
                  >
                    <option value="" disabled>Select Source Protocol...</option>
                    {availableForms.map((f) => <option key={f.id} value={f.id.toString()}>{f.formName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-primary/60 ml-1">Data Stream (Column)</label>
                  <select
                    value={activeField.sourceColumn || ""}
                    onChange={(e) => updateField(activeField.id, "sourceColumn", e.target.value)}
                    className="w-full bg-white border border-primary/10 p-4 rounded-2xl text-[13px] font-black text-slate-800 outline-none focus:border-primary transition-all shadow-xl shadow-primary/5 disabled:opacity-50"
                    disabled={!activeField.sourceTable}
                  >
                    <option value="" disabled>Select Data Stream...</option>
                    {selectedFormFields.map((f) => <option key={f.fieldName} value={f.fieldName}>{f.fieldName} ({f.fieldType})</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {activeField.type === "number" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">Min Magnitude</span>
              <input
                type="number"
                value={activeField.min}
                onChange={(e) => handleNumberInput(e, activeField.id, "min")}
                placeholder="-∞"
                className={inputBase}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10">Max Magnitude</span>
              <input
                type="number"
                value={activeField.max}
                onChange={(e) => handleNumberInput(e, activeField.id, "max")}
                placeholder="+∞"
                className={inputBase}
              />
            </div>
          </div>
        )}

        {activeField.type === "date" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <span className="absolute left-4 top-2 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">Earliest Temporal Phase</span>
                <input
                  type="date"
                  value={activeField.afterDate}
                  onChange={(e) => updateField(activeField.id, "afterDate", e.target.value)}
                  className={`${inputBase} pt-6`}
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-2 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10">Latest Temporal Phase</span>
                <input
                  type="date"
                  value={activeField.beforeDate}
                  onChange={(e) => updateField(activeField.id, "beforeDate", e.target.value)}
                  className={`${inputBase} pt-6`}
                />
              </div>
            </div>
          </div>
        )}

        {activeField.type === "time" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute left-4 top-2 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">Start Gate</span>
              <input
                type="time"
                value={activeField.afterTime ?? ""}
                onChange={(e) => updateField(activeField.id, "afterTime", e.target.value)}
                className={`${inputBase} pt-6`}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-2 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10">End Gate</span>
              <input
                type="time"
                value={activeField.beforeTime ?? ""}
                onChange={(e) => updateField(activeField.id, "beforeTime", e.target.value)}
                className={`${inputBase} pt-6`}
              />
            </div>
          </div>
        )}

        {activeField.type === "url" && (
          <div className="premium-card bg-primary/5 border-primary/10 !rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                <Code2 size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Protocol Integrity</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-4 italic transition-colors group-hover:text-slate-700">
              "Architecture automatically enforces <span className="text-primary">HTTPS/HTTP</span> protocol standards for all incoming dimensional links."
            </p>
            <div className="flex gap-2">
              <span className={`${badgeBase} bg-white text-primary border-primary/10`}>Secure</span>
              <span className={`${badgeBase} bg-white text-slate-400 border-slate-100`}>Dimensional</span>
            </div>
          </div>
        )}

        {activeField.type === "file_upload" && (
          <div className="space-y-10">
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-[9px] text-slate-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">Max File Size (MB)</span>
              <select
                value={activeField.maxFileSize || "5"}
                onChange={(e) => updateField(activeField.id, "maxFileSize", e.target.value)}
                className={inputBase}
              >
                <option value="2">2 MB (Standard)</option>
                <option value="5">5 MB (Aggregated)</option>
                <option value="10">10 MB (Heavy Payload)</option>
              </select>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase px-1">Allowed Dimensional Formats</span>
              <div className="grid grid-cols-2 gap-2">
                {["pdf", "jpg", "png", "xlsx", "xml"].map((ext) => {
                  const currentTypes = (activeField.allowedFileTypes || "").split(",").map(t => t.trim()).filter(Boolean);
                  const isSelected = currentTypes.includes(ext);
                  return (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => {
                        const updated = isSelected
                          ? currentTypes.filter(t => t !== ext)
                          : [...currentTypes, ext];
                        updateField(activeField.id, "allowedFileTypes", updated.join(","));
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isSelected
                          ? "bg-primary/5 border-primary text-primary"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary animate-pulse" : "bg-slate-200"}`} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{ext}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
