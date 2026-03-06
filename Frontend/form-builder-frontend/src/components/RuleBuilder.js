"use client";

import { useState } from "react";
import { Plus, Trash2, GitBranch, AlertTriangle, Eye, EyeOff, Star, X } from "lucide-react";

const OPERATORS = [
    { value: "EQUALS", label: "equals" },
    { value: "NOT_EQUALS", label: "not equals" },
    { value: "GREATER_THAN", label: "greater than" },
    { value: "LESS_THAN", label: "less than" },
    { value: "CONTAINS", label: "contains" },
];

const ACTION_TYPES = [
    { value: "SHOW", label: "Show field", icon: "👁", color: "emerald" },
    { value: "HIDE", label: "Hide field", icon: "🙈", color: "slate" },
    { value: "REQUIRE", label: "Make required", icon: "⭐", color: "amber" },
    { value: "VALIDATION_ERROR", label: "Reject with error", icon: "🚫", color: "red" },
];

const LOGICAL_OPERATORS = [
    { value: "AND", label: "ALL conditions must match (AND)" },
    { value: "OR", label: "ANY condition must match (OR)" },
];

const emptyCondition = () => ({ field: "", operator: "EQUALS", value: "" });

/**
 * RuleBuilder — a reusable visual IF/THEN rule editor.
 *
 * Props:
 *   rules        - array of FormRuleDTO
 *   onChange     - called with updated rules array
 *   fieldNames   - string[] of available field names to pick from
 */
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

    const getActionColor = (type) => {
        const t = ACTION_TYPES.find((a) => a.value === type);
        return t?.color || "slate";
    };

    const actionColorMap = {
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.06)] ring-1 ring-emerald-300/40",
        slate: "bg-slate-50 border-slate-200 text-slate-700 shadow-[0_0_15px_rgba(100,116,139,0.06)] ring-1 ring-slate-300/40",
        amber: "bg-amber-50 border-amber-200 text-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.06)] ring-1 ring-amber-300/40",
        red: "bg-rose-50 border-rose-200 text-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.06)] ring-1 ring-rose-300/40",
    };

    const actionTypeRing = {
        emerald: "ring-emerald-400",
        slate: "ring-slate-400",
        amber: "ring-amber-400",
        red: "ring-red-400",
    };

    const inputCls =
        "bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm w-full hover:border-slate-300";
    const selectCls = inputCls + " appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center] pr-10";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-indigo-500" />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                        Conditional Rules
                    </span>
                    {rules.length > 0 && (
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                            {rules.length} rule{rules.length > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={addRule}
                    className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md hover:shadow-lg shadow-indigo-500/20 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={14} /> Add Rule
                </button>
            </div>

            {/* Empty state */}
            {rules.length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
                    <GitBranch size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">No rules yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Rules let you show, hide, or require fields based on answers.
                    </p>
                </div>
            )}

            {/* Rules list */}
            {rules.map((rule, ruleIdx) => {
                const isExpanded = expandedRules.has(rule._id);
                const actionType = rule.action?.type || "SHOW";
                const actionInfo = ACTION_TYPES.find((a) => a.value === actionType);
                const color = getActionColor(actionType);
                const conditions = rule.condition?.conditions || [];

                return (
                    <div
                        key={rule._id || ruleIdx}
                        className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "border-indigo-200 bg-white shadow-lg shadow-indigo-500/5 ring-4 ring-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"}`}
                    >
                        {/* Rule header — always visible */}
                        <div
                            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${isExpanded ? "bg-indigo-50/40" : ""}`}
                            onClick={() => toggleExpand(rule._id)}
                        >
                            <div
                                className={`flex items-center gap-2 flex-1 px-3 py-1.5 rounded-xl border text-xs font-black ${actionColorMap[color] || actionColorMap.slate}`}
                            >
                                <span>{actionInfo?.icon}</span>
                                <span>{actionInfo?.label || actionType}</span>
                                {rule.action?.targetField && (
                                    <>
                                        <span className="opacity-40">→</span>
                                        <code className="font-mono text-[11px]">{rule.action.targetField}</code>
                                    </>
                                )}
                                {conditions.length > 0 && (
                                    <span className="ml-auto opacity-70 font-medium">
                                        {conditions.length} condition{conditions.length > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeRule(ruleIdx);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                                <div
                                    className={`w-5 h-5 flex items-center justify-center text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                >
                                    ▶
                                </div>
                            </div>
                        </div>

                        {/* Rule body — collapsible */}
                        {isExpanded && (
                            <div className="p-4 pt-0 space-y-4 border-t border-slate-100">

                                {/* ── IF Section ─────────────────────────────────────── */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            IF (Conditions)
                                        </span>
                                        {conditions.length > 1 && (
                                            <select
                                                value={rule.condition?.logicalOperator || "AND"}
                                                onChange={(e) => updateLogical(ruleIdx, e.target.value)}
                                                className="text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
                                            >
                                                {LOGICAL_OPERATORS.map((lo) => (
                                                    <option key={lo.value} value={lo.value}>
                                                        {lo.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {conditions.map((cond, condIdx) => (
                                        <div
                                            key={condIdx}
                                            className="flex flex-col gap-2.5 bg-slate-50/50 p-4 pt-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors relative"
                                        >
                                            {/* Condition index badge */}
                                            {conditions.length > 1 && (
                                                <div className="absolute top-0 left-0 bg-slate-200/50 border-b border-r border-slate-200 text-[9px] font-black text-slate-600 px-2.5 py-0.5 rounded-br-lg rounded-tl-xl shadow-sm">
                                                    {condIdx === 0
                                                        ? "IF"
                                                        : rule.condition?.logicalOperator || "AND"}
                                                </div>
                                            )}

                                            {/* Remove condition button */}
                                            {conditions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCondition(ruleIdx, condIdx)}
                                                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all outline-none"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}

                                            {/* Field picker */}
                                            <div className="w-full mt-2">
                                                <select
                                                    value={cond.field}
                                                    onChange={(e) =>
                                                        updateCondition(ruleIdx, condIdx, "field", e.target.value)
                                                    }
                                                    className={selectCls}
                                                >
                                                    <option value="">Select field...</option>
                                                    {fieldNames.map((name) => (
                                                        <option key={name} value={name}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Operator */}
                                            <div className="w-full">
                                                <select
                                                    value={cond.operator}
                                                    onChange={(e) =>
                                                        updateCondition(ruleIdx, condIdx, "operator", e.target.value)
                                                    }
                                                    className={selectCls}
                                                >
                                                    {OPERATORS.map((op) => (
                                                        <option key={op.value} value={op.value}>
                                                            {op.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Value */}
                                            <div className="w-full">
                                                <input
                                                    type="text"
                                                    placeholder="value..."
                                                    value={cond.value ?? ""}
                                                    onChange={(e) =>
                                                        updateCondition(ruleIdx, condIdx, "value", e.target.value)
                                                    }
                                                    className={inputCls}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addCondition(ruleIdx)}
                                        className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={12} /> Add condition
                                    </button>
                                </div>

                                {/* ── THEN Section ────────────────────────────────────── */}
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        THEN (Action)
                                    </span>

                                    {/* Action type picker */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {ACTION_TYPES.map((at) => {
                                            const isActive = actionType === at.value;
                                            return (
                                                <button
                                                    key={at.value}
                                                    type="button"
                                                    onClick={() => updateAction(ruleIdx, "type", at.value)}
                                                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-bold transition-all duration-300 ${isActive
                                                        ? `${actionColorMap[at.color]} scale-[1.02] shadow-[0_4px_15px_rgba(0,0,0,0.05)] ring-2 ${actionTypeRing[at.color]}`
                                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:shadow shadow-sm hover:border-slate-300 hover:-translate-y-0.5"
                                                        }`}
                                                >
                                                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? "bg-white/50 backdrop-blur-sm shadow-sm" : "bg-slate-100"}`}>{at.icon}</span>
                                                    <span>{at.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Target field — for SHOW, HIDE, REQUIRE */}
                                    {actionType !== "VALIDATION_ERROR" && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                                Target Field
                                            </label>
                                            <select
                                                value={rule.action?.targetField || ""}
                                                onChange={(e) => updateAction(ruleIdx, "targetField", e.target.value)}
                                                className={selectCls}
                                            >
                                                <option value="">Select field...</option>
                                                {fieldNames.map((name) => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Error message — for VALIDATION_ERROR */}
                                    {actionType === "VALIDATION_ERROR" && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                                Error Message
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. You must be 18+ to submit this form"
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
    );
}
