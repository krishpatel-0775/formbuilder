import { X, SlidersHorizontal, GitBranch, ShieldCheck } from "lucide-react";
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
  if (!activeField || isDisplayOnly(activeField.type)) {
    return (
      <aside className="w-[400px] bg-white border-l border-slate-200 shadow-[-20px_0_40px_rgba(0,0,0,0.06)] transition-all duration-500 translate-x-full absolute right-0 h-full z-30 flex flex-col" />
    );
  }

  return (
    <aside className="w-[400px] bg-white border-l border-slate-200 shadow-[-20px_0_40px_rgba(0,0,0,0.06)] transition-all duration-500 translate-x-0 absolute right-0 h-full z-30 flex flex-col">
      {/* Sidebar header with field type + close */}
      <div className="px-6 pt-6 pb-0 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl text-sm">
            {FieldIcons[activeField.type]}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Field Settings</p>
            <p className="text-sm font-black text-slate-900 capitalize">{activeField.type}</p>
          </div>
        </div>
        <button onClick={() => { setActiveFieldId(null); setSidebarTab("properties"); }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="px-6 pt-4 pb-0 flex-shrink-0">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSidebarTab("properties")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all ${sidebarTab === "properties" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <SlidersHorizontal size={12} /> Properties
          </button>
          <button
            onClick={() => setSidebarTab("logic")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all relative ${sidebarTab === "logic" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <GitBranch size={12} /> Logic
            {(() => {
              const fn = activeField.label ? activeField.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "";
              const count = rules.filter((r) => r.action?.targetField === fn).length;
              return count > 0 ? (
                <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${sidebarTab === "logic" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"}`}>{count}</span>
              ) : null;
            })()}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-slate-100 mt-4 flex-shrink-0" />

      {/* PROPERTIES TAB */}
      {sidebarTab === "properties" && (
        <SidebarProps 
          activeField={activeField}
          updateField={updateField}
          handleNumberInput={handleNumberInput}
          availableForms={availableForms}
          selectedFormFields={selectedFormFields}
        />
      )}

      {/* LOGIC TAB */}
      {sidebarTab === "logic" && (
        <SidebarLogic 
          activeField={activeField}
          fields={fields}
          rules={rules}
          setRules={setRules}
        />
      )}

      {/* Shared footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-center gap-2 bg-white border border-slate-100 py-3 rounded-xl shadow-sm">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Settings are auto-saved</span>
        </div>
      </div>
    </aside>
  );
}
