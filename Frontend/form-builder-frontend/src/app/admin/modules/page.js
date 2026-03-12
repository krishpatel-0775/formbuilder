"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, ChevronRight, ChevronDown } from "lucide-react";

export default function ModulesPage() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [formData, setFormData] = useState({
        moduleName: "",
        moduleDescription: "",
        prefix: "",
        plugin: "",
        controller: "",
        action: "",
        parentId: null,
        subParentId: null,
        iconCss: "",
        isParent: false,
        isSubParent: false,
        active: true
    });

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const res = await fetch("http://localhost:9090/api/modules", {
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setModules(data.data);
            }
        } catch (err) {
            console.error("Error fetching modules:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = editingModule 
            ? `http://localhost:9090/api/modules/${editingModule.id}`
            : "http://localhost:9090/api/modules";
        const method = editingModule ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                fetchModules();
                setShowModal(false);
                resetForm();
            }
        } catch (err) {
            console.error("Error saving module:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            moduleName: "",
            moduleDescription: "",
            prefix: "",
            plugin: "",
            controller: "",
            action: "",
            parentId: null,
            subParentId: null,
            iconCss: "",
            isParent: false,
            isSubParent: false,
            active: true
        });
        setEditingModule(null);
    };

    const openEdit = (mod) => {
        setEditingModule(mod);
        setFormData({
            moduleName: mod.moduleName,
            moduleDescription: mod.moduleDescription,
            prefix: mod.prefix || "",
            plugin: mod.plugin || "",
            controller: mod.controller || "",
            action: mod.action || "",
            parentId: mod.parentId,
            subParentId: mod.subParentId,
            iconCss: mod.iconCss || "",
            isParent: mod.parent,
            isSubParent: mod.subParent,
            active: mod.active
        });
        setShowModal(true);
    };

    if (loading) return <div className="p-8">Loading modules...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Module Management</h1>
                    <p className="text-slate-500 text-sm">Create and manage sidebar menu items dynamically.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                    <Plus size={18} /> Add New Module
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prefix</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {modules.map(mod => (
                            <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                            {mod.iconCss ? <i className={mod.iconCss}></i> : mod.moduleName[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 truncate max-w-[200px]">{mod.moduleName}</p>
                                            <p className="text-[10px] text-slate-400">{mod.moduleDescription}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${mod.parent ? 'bg-purple-100 text-purple-600' : mod.subParent ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {mod.parent ? 'Parent' : mod.subParent ? 'Sub-Parent' : 'Link'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">{mod.prefix || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-xs font-bold ${mod.active ? 'text-green-500' : 'text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${mod.active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                        {mod.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => openEdit(mod)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingModule ? 'Edit Module' : 'Create Module'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Module Name</label>
                                <input 
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                    value={formData.moduleName}
                                    onChange={e => setFormData({...formData, moduleName: e.target.value})}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL Prefix</label>
                                <input 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                    value={formData.prefix}
                                    onChange={e => setFormData({...formData, prefix: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all h-24"
                                    value={formData.moduleDescription}
                                    onChange={e => setFormData({...formData, moduleDescription: e.target.value})}
                                />
                            </div>

                            <div className="flex items-center gap-6 col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="hidden" checked={formData.isParent} onChange={e => setFormData({...formData, isParent: e.target.checked, isSubParent: false})} />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.isParent ? 'bg-blue-600 border-blue-600' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                        {formData.isParent && <Check size={12} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Is Parent</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="hidden" checked={formData.isSubParent} onChange={e => setFormData({...formData, isSubParent: e.target.checked, isParent: false})} />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.isSubParent ? 'bg-orange-500 border-orange-500' : 'border-slate-200 group-hover:border-orange-400'}`}>
                                        {formData.isSubParent && <Check size={12} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Is Sub-Parent</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group ml-auto">
                                    <input type="checkbox" className="hidden" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                                    <div className={`w-10 h-5 rounded-full transition-all relative ${formData.active ? 'bg-green-500' : 'bg-slate-200'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.active ? 'right-1' : 'left-1'}`} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Active</span>
                                </label>
                            </div>

                            {!formData.isParent && (
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Parent Module</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                                        value={formData.parentId || ""}
                                        onChange={e => setFormData({...formData, parentId: e.target.value || null})}
                                    >
                                        <option value="">None</option>
                                        {modules.filter(m => m.parent && m.id !== editingModule?.id).map(m => (
                                            <option key={m.id} value={m.id}>{m.moduleName}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.isSubParent && !formData.isParent && (
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Icon (Lucide Class)</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        value={formData.iconCss}
                                        onChange={e => setFormData({...formData, iconCss: e.target.value})}
                                        placeholder="e.g. layout"
                                    />
                                </div>
                            )}

                            <div className="col-span-2 flex gap-4 mt-4">
                                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Save Changes</button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-[20px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
