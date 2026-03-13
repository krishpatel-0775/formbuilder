import { AlertTriangle, GitBranch, Sparkles } from "lucide-react";
import RuleBuilder from "../RuleBuilder";

export function SidebarLogic({ 
  activeField, 
  fields, 
  rules, 
  setRules 
}) {
  const fieldName = activeField.label
    ? activeField.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    : "";

  if (!fieldName) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-slate-500">
          <div className="w-24 h-24 rounded-[2rem] bg-orange-50 border border-orange-100 flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/10">
              <div className="p-4 bg-orange-100/50 rounded-2xl text-orange-500">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Identity Required</h3>
          <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.15em] max-w-[240px] leading-relaxed">
              Define a component name in the properties tab before establishing form logic.
          </p>
      </div>
    );
  }

  const allFieldNames = fields
    .map((f) => f.label ? f.label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") : "")
    .filter(Boolean);

  // Rules that target this field
  const fieldRules = rules.filter((r) => r.action?.targetField === fieldName);
  // All other rules
  const otherRules = rules.filter((r) => r.action?.targetField !== fieldName);

  const handleFieldRulesChange = (updated) => {
    setRules([...otherRules, ...updated]);
  };

  const addFieldRule = () => {
    const newRule = {
      _id: Date.now() + Math.random(),
      condition: { logicalOperator: "AND", conditions: [{ field: "", operator: "EQUALS", value: "" }] },
      action: { type: "SHOW", targetField: fieldName, message: "" },
    };
    setRules([...rules, newRule]);
  };

  return (
    <div className="flex-1 flex flex-col pb-10">
      {/* Logic info banner */}
      <div className="premium-card bg-primary/5 border-primary/10 !rounded-[2rem] p-6 mb-8 group hover:border-primary/20 transition-all">
        <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20`}>
                <GitBranch size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Logic Protocol</span>
        </div>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic transition-colors group-hover:text-slate-700">
           Establish conditional visibility and operational constraints for <span className="text-primary font-black">"{activeField.label}"</span> based on form dependencies.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Defined Rules</label>
            </div>
            <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full">{fieldRules.length} Active</span>
        </div>
        
        <RuleBuilder
          rules={fieldRules}
          onChange={handleFieldRulesChange}
          fieldNames={allFieldNames}
          defaultTargetField={fieldName}
          onAddRule={addFieldRule}
        />
      </div>
    </div>
  );
}
