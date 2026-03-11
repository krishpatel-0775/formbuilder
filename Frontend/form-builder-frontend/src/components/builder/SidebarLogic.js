import { AlertTriangle, GitBranch } from "lucide-react";
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
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={24} />
        </div>
        <p className="text-sm font-bold text-slate-700">Question Title Required</p>
        <p className="text-xs mt-2 text-slate-500 max-w-[200px]">
          Please enter a question title for this field in the Properties tab before adding logic rules.
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Logic tab info banner */}
      <div className="mx-4 mt-4 mb-2 px-4 py-3 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 flex-shrink-0">
        <GitBranch size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
          Rules here control when <strong className="font-black">{activeField.label || "this field"}</strong> is shown, hidden, or required.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
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
