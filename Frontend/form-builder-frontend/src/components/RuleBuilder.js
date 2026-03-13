"use client";

import { useState } from "react";
import { Plus, Trash2, GitBranch, AlertTriangle, Eye, EyeOff, Star, X, Sparkles, ChevronRight, Zap, Target } from "lucide-react";

const OPERATORS = [
    { value: "EQUALS", label: "Strictly Equals" },
    { value: "NOT_EQUALS", label: "Does Not Equal" },
    { value: "GREATER_THAN", label: "Exceeds" },
    { value: "LESS_THAN", label: "Falls Below" },
    { value: "CONTAINS", label: "Includes Phrase" },
];

const ACTION_TYPES = [
    { value: "SHOW", label: "Reveal Element", icon: <Eye size={14} />, color: "primary" },
    { value: "HIDE", label: "Occlude Element", icon: <EyeOff size={14} />, color: "slate" },
    { value: "REQUIRE", label: "Enforce Integrity", icon: <Star size={14} />, color: "amber" },
    { value: "VALIDATION_ERROR", label: "Validation Error", icon: <X size={14} />, color: "red" },
];

const LOGICAL_OPERATORS = [
    { value: "AND", label: "Universal Satisfiability (AND)" },
    { value: "OR", label: "Existential Satisfiability (OR)" },
];

const emptyCondition = () => ({ field: "", operator: "EQUALS", value: "" });

export default function RuleBuilder({ rules = [], onChange, fieldNames = [], defaultTargetField = "" }) {
    const [expandedRules, setExpandedRules] = useState(new Set());

    const addRule = () => {
        const rule = {
            _id: Date.now() + Math.random(),
            condition: {
                logicalOperator: "AND",
                conditions: [emptyCondition()],
            },
            action: { type: "SHOW", targetField: defaultTargetField, message: "" },
        };
        onChange([...rules, rule]);
        setExpandedRules((prev) => new Set([...prev, rule._id]));
    };

    const removeRule = (idx) => {
        onChange(rules.filter((_, i) => i !== idx));
    };

    const toggleExpand = (id) => {
        setExpandedRules((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const updateRule = (idx, updater) => {
        onChange(rules.map((r, i) => (i === idx ? updater(r) : r)));
    };

    const addCondition = (ruleIdx) => {
        updateRule(ruleIdx, (r) => ({
            ...r,
            condition: {
                ...r.condition,
                conditions: [...(r.condition.conditions || []), emptyCondition()],
            },
        }));
    };

    const removeCondition = (ruleIdx, condIdx) => {
        updateRule(ruleIdx, (r) => ({
            ...r,
            condition: {
                ...r.condition,
                conditions: r.condition.conditions.filter((_, i) => i !== condIdx),
            },
        }));
    };

    const updateCondition = (ruleIdx, condIdx, key, value) => {
        updateRule(ruleIdx, (r) => ({
            ...r,
            condition: {
                ...r.condition,
                conditions: r.condition.conditions.map((c, i) =>
                    i === condIdx ? { ...c, [key]: value } : c
                ),
            },
        }));
    };

    const updateAction = (ruleIdx, key, value) => {
        updateRule(ruleIdx, (r) => ({
            ...r,
            action: { ...r.action, [key]: value },
        }));
    };

    const updateLogical = (ruleIdx, value) => {
        updateRule(ruleIdx, (r) => ({
            ...r,
            condition: { ...r.condition, logicalOperator: value },
        }));
    };

    const actionStyles = {
        primary: "bg-primary/5 border-primary text-primary shadow-xl shadow-primary/5",
        slate: "bg-slate-50 border-slate-200 text-slate-500",
        amber: "bg-amber-50/50 border-amber-200 text-amber-600 shadow-xl shadow-amber-500/5",
        red: "bg-red-50/50 border-red-200 text-red-500 shadow-xl shadow-red-500/5",
    };

    const inputCls = "w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-200 shadow-sm";
    const selectCls = inputCls + " appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_15px_center] pr-12";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Logic Engine</span>
                </div>
                <button
                    type="button"
                    onClick={addRule}
                    className="flex items-center gap-2 text-[10px] font-black text-white bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 px-4 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                >
                    <Plus size={14} strokeWidth={3} /> Inject Rule
                </button>
            </div>

            {rules.length === 0 && (
                <div className="border-2 border-dashed border-slate-100 rounded-[2.5rem] p-10 text-center bg-slate-50/30 group hover:border-primary/20 transition-all">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 group-hover:scale-110 transition-transform">
                        <GitBranch size={24} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm font-black text-slate-800 tracking-tight">No Rules Defined</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto">
                        Incorporate conditional rules to orchestrate dynamic experiences.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {rules.map((rule, ruleIdx) => {
                    const isExpanded = expandedRules.has(rule._id);
                    const actionType = rule.action?.type || "SHOW";
                    const actionInfo = ACTION_TYPES.find((a) => a.value === actionType);
                    const styleClass = actionStyles[actionInfo?.color || "slate"];
                    const conditions = rule.condition?.conditions || [];

                    return (
                        <div
                            key={rule._id || ruleIdx}
                            className={`group border rounded-[2rem] overflow-hidden transition-all duration-700 ease-in-out ${
                                isExpanded 
                                ? "border-primary shadow-[0_30px_60px_rgba(59,130,246,0.1)] bg-white ring-4 ring-primary/5 -translate-y-1" 
                                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl shadow-sm"
                            }`}
                        >
                            {/* Rule header */}
                            <div
                                className={`flex items-center gap-4 p-5 cursor-pointer transition-all ${isExpanded ? "bg-primary/5" : ""}`}
                                onClick={() => toggleExpand(rule._id)}
                            >
                                <div className={`flex items-center gap-3 flex-1 px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${styleClass}`}>
                                    <div className={`p-1.5 rounded-lg ${isExpanded ? "bg-white shadow-sm" : "bg-white/50"}`}>
                                        {actionInfo?.icon}
                                    </div>
                                    <span>{actionInfo?.label}</span>
                                    {rule.action?.targetField && (
                                        <>
                                            <ChevronRight size={12} className="opacity-30" />
                                            <span className="text-slate-400 font-mono tracking-tighter lowercase">{rule.action.targetField}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeRule(ruleIdx); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className={`w-6 h-6 flex items-center justify-center text-slate-300 transition-transform duration-500 ${isExpanded ? "rotate-90 text-primary" : ""}`}>
                                        <ChevronRight size={20} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>

                            {/* Rule body */}
                            {isExpanded && (
                                <div className="p-8 pt-0 space-y-8 animate-in fade-in duration-700">
                                    <div className="w-full h-px bg-slate-100/50" />

                                    {/* IF Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target size={14} className="text-primary" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Constraint Protocol</span>
                                            </div>
                                            {conditions.length > 1 && (
                                                <select
                                                    value={rule.condition?.logicalOperator || "AND"}
                                                    onChange={(e) => updateLogical(ruleIdx, e.target.value)}
                                                    className="text-[9px] font-black border border-slate-100 rounded-full px-3 py-1 bg-slate-50 text-slate-600 outline-none focus:border-primary cursor-pointer hover:bg-white transition-all uppercase tracking-widest"
                                                >
                                                    {LOGICAL_OPERATORS.map((lo) => (
                                                        <option key={lo.value} value={lo.value}>{lo.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {conditions.map((cond, condIdx) => (
                                                <div
                                                    key={condIdx}
                                                    className="flex flex-col gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all relative group/cond"
                                                >
                                                    {conditions.length > 1 && (
                                                        <div className="absolute top-0 left-6 -translate-y-1/2 bg-white border border-slate-100 text-[8px] font-black text-primary px-3 py-1 rounded-full shadow-sm uppercase tracking-[0.2em]">
                                                            {condIdx === 0 ? "Initial Cond" : (rule.condition?.logicalOperator || "AND")}
                                                        </div>
                                                    )}

                                                    {conditions.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCondition(ruleIdx, condIdx)}
                                                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/cond:opacity-100"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    )}

                                                    <div className="grid grid-cols-1 gap-3 mt-2">
                                                        <select
                                                            value={cond.field}
                                                            onChange={(e) => updateCondition(ruleIdx, condIdx, "field", e.target.value)}
                                                            className={selectCls}
                                                        >
                                                            <option value="" disabled>Select dependency field...</option>
                                                            {fieldNames.map((name) => <option key={name} value={name}>{name}</option>)}
                                                        </select>

                                                        <div className="flex gap-3">
                                                            <div className="w-[45%]">
                                                                <select
                                                                    value={cond.operator}
                                                                    onChange={(e) => updateCondition(ruleIdx, condIdx, "operator", e.target.value)}
                                                                    className={selectCls}
                                                                >
                                                                    {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Threshold value..."
                                                                    value={cond.value ?? ""}
                                                                    onChange={(e) => updateCondition(ruleIdx, condIdx, "value", e.target.value)}
                                                                    className={inputCls}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addCondition(ruleIdx)}
                                                className="w-full py-4 border-2 border-dashed border-slate-100 rounded-[1.5rem] text-[10px] font-black text-slate-300 uppercase tracking-widest hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={14} strokeWidth={3} /> Append Sub-Condition
                                            </button>
                                        </div>
                                    </div>

                                    {/* THEN Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 px-1">
                                            <Sparkles size={14} className="text-primary" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Result</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {ACTION_TYPES.map((at) => {
                                                const isActive = actionType === at.value;
                                                const activeStyle = actionStyles[at.color];
                                                return (
                                                    <button
                                                        key={at.value}
                                                        type="button"
                                                        onClick={() => updateAction(ruleIdx, "type", at.value)}
                                                        className={`flex items-center gap-3 p-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all duration-500 ease-out ${
                                                            isActive
                                                            ? `${activeStyle} shadow-lg ring-2 ring-primary/10 translate-y-[-2px]`
                                                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50/50"
                                                        }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-white shadow-sm" : "bg-slate-50"}`}>
                                                            {at.icon}
                                                        </div>
                                                        <span>{at.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {actionType !== "VALIDATION_ERROR" && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Dimension</label>
                                                <select
                                                    value={rule.action?.targetField || ""}
                                                    onChange={(e) => updateAction(ruleIdx, "targetField", e.target.value)}
                                                    className={selectCls}
                                                >
                                                    <option value="" disabled>Select target field...</option>
                                                    {fieldNames.map((name) => <option key={name} value={name}>{name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {actionType === "VALIDATION_ERROR" && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Validation Error Message</label>
                                                <input
                                                    type="text"
                                                    placeholder="Specify error message..."
                                                    value={rule.action?.message || ""}
                                                    onChange={(e) => updateAction(ruleIdx, "message", e.target.value)}
                                                    className={inputCls}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
