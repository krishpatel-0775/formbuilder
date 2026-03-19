import { X, SlidersHorizontal, GitBranch, ShieldCheck, Settings2, Code2 } from "lucide-react";
import { SidebarProps } from "./SidebarProps";
import { SidebarLogic } from "./SidebarLogic";
import { FieldIcons } from "./FieldConstants";

export function Sidebar({ 
  activeField, 
  setActiveFieldId, 
  sidebarTab, 
  setSidebarTab, 
  updateField, 
  handleNumberInput, 
  availableForms, 
  selectedFormFields,
  fields,
  rules,
  setRules,
  isDisplayOnly
}) {
  const isOpen = activeField && !isDisplayOnly(activeField.type);

  return (
    <aside className={`bg-white border-slate-100 shadow-[-10px_0_50px_rgba(0,0,0,0.03)] transition-all duration-700 ease-in-out flex flex-col flex-shrink-0 overflow-hidden relative z-20 ${isOpen ? "w-[300px] lg:w-[340px] xl:w-[400px] max-w-full border-l opacity-100" : "w-0 border-l-0 opacity-0"}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-32">
      {/* Sidebar header */}
      <div className="p-8 pb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500 shadow-inner ${
              sidebarTab === "logic" ? "bg-primary text-white border-primary shadow-primary/20" : "bg-slate-50 text-slate-400 border-slate-100"
          }`}>
            {sidebarTab === "logic" ? <Code2 size={24} /> : FieldIcons[activeField?.type]}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Configuration</p>
            <p className="text-lg font-black text-slate-800 tracking-tight capitalize">
                {sidebarTab === "logic" ? "Architectural Logic" : (activeField?.type || "Field Props")}
            </p>
          </div>
        </div>
        <button 
          onClick={() => { setActiveFieldId(null); setSidebarTab("properties"); }}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all hover:rotate-90"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="px-8 py-4 flex-shrink-0">
        <div className="flex gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setSidebarTab("properties")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                sidebarTab === "properties" 
                ? "bg-white text-slate-900 shadow-xl shadow-slate-200/50" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Settings2 size={14} strokeWidth={2.5} /> Properties
          </button>
          <button
            onClick={() => setSidebarTab("logic")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all relative ${
                sidebarTab === "logic" 
                ? "bg-primary text-white shadow-xl shadow-primary/20" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <GitBranch size={14} strokeWidth={2.5} /> Logic
            {(() => {
              const fn = activeField?.label ? activeField.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
              const count = rules.filter((r) => r.action?.targetField === fn).length;
              return count > 0 ? (
                <span className={`ml-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    sidebarTab === "logic" ? "bg-white text-primary" : "bg-primary text-white"
                }`}>{count}</span>
              ) : null;
            })()}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-4 space-y-8">
        {sidebarTab === "properties" && activeField && (
          <SidebarProps 
            activeField={activeField}
            updateField={updateField}
            handleNumberInput={handleNumberInput}
            availableForms={availableForms}
            selectedFormFields={selectedFormFields}
          />
        )}

        {sidebarTab === "logic" && activeField && (
          <SidebarLogic 
            activeField={activeField}
            fields={fields}
            rules={rules}
            setRules={setRules}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm group hover:border-emerald-200 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
          </div>
          <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-0.5">Persistence Engine</p>
              <p className="text-[11px] font-bold text-slate-400">Settings are auto-saved to workspace</p>
          </div>
        </div>
      </div>
      </div>
    </aside>
  );
}
