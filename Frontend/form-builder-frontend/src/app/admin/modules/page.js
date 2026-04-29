"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, ChevronRight, ChevronDown, Layout, Sidebar, Box } from "lucide-react";
import { DynamicIcon } from "../../Sidebar";
import { ENDPOINTS } from "../../../config/apiConfig";
import apiClient from "../../../utils/apiClient";

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
            const res = await apiClient.get(ENDPOINTS.MODULES);
            if (res.data.success) {
                setModules(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching modules:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parentModule: formData.parentId ? { id: formData.parentId } : null,
                subParentModule: formData.subParentId ? { id: formData.subParentId } : null
            };
            
            const res = editingModule 
                ? await apiClient.put(`${ENDPOINTS.MODULES}/${editingModule.id}`, payload)
                : await apiClient.post(ENDPOINTS.MODULES, payload);
            
            if (res.data.success) {
                fetchModules();
                setShowModal(false);
                resetForm();
            }
        } catch (err) {
            console.error("Error saving module:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this module? This will also delete all sub-modules.")) return;

        try {
            const res = await apiClient.delete(`${ENDPOINTS.MODULES}/${id}`);
            if (res.data.success) {
                fetchModules();
            }
        } catch (err) {
            console.error("Error deleting module:", err);
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
            moduleDescription: mod.moduleDescription || "",
            prefix: mod.prefix || "",
            plugin: mod.plugin || "",
            controller: mod.controller || "",
            action: mod.action || "",
            parentId: mod.parentModule?.id || null,
            subParentId: mod.subParentModule?.id || null,
            iconCss: mod.iconCss || "",
            isParent: mod.isParent,
            isSubParent: mod.isSubParent,
            active: mod.active
        });
        setShowModal(true);
    };

    if (loading) return (
        <div className="p-10 space-y-4 animate-pulse">
            <div className="h-12 bg-white rounded-2xl w-1/4"></div>
            <div className="h-64 bg-white rounded-[2rem]"></div>
        </div>
    );

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Box size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Module Management</h1>
                    </div>
                    <p className="text-slate-500 font-medium tracking-tight">Configure and organize your application's navigational structure.</p>
                </div>

                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                >
                    <Plus size={20} strokeWidth={3} />
                    Add New Module
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prefix</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {modules.map(mod => (
                            <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                            <DynamicIcon iconName={mod.iconCss} size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 tracking-tight">{mod.moduleName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[200px]">
                                                {mod.moduleDescription || "No description"}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        mod.isParent ? 'bg-purple-100 text-purple-600' : 
                                        mod.isSubParent ? 'bg-orange-100 text-orange-600' : 
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {mod.isParent ? 'Parent' : mod.isSubParent ? 'Sub-Parent' : 'Link'}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 tracking-tight">
                                        {mod.prefix || '-'}
                                    </code>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${mod.active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${mod.active ? 'text-green-600' : 'text-slate-400'}`}>
                                            {mod.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => openEdit(mod)}
                                            className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(mod.id)}
                                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                {editingModule ? 'Edit Module' : 'Create Module'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto custom-scrollbar">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 px-1">Module Name</label>
                                <input 
                                    required
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                    value={formData.moduleName}
                                    onChange={e => setFormData({...formData, moduleName: e.target.value})}
                                    placeholder="e.g. Dashboard"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 px-1">Route Prefix</label>
                                <input 
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                    value={formData.prefix || ""}
                                    onChange={e => setFormData({...formData, prefix: e.target.value})}
                                    placeholder="e.g. /admin/dashboard"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 px-1">Description</label>
                                <textarea 
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all h-20 shadow-inner resize-none"
                                    value={formData.moduleDescription || ""}
                                    onChange={e => setFormData({...formData, moduleDescription: e.target.value})}
                                    placeholder="Describe the module purpose..."
                                />
                            </div>

                            <div className="col-span-2 bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="hidden" checked={formData.isParent} onChange={e => setFormData({...formData, isParent: e.target.checked, isSubParent: false, parentId: null, subParentId: null})} />
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isParent ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-200 group-hover:border-primary/50'}`}>
                                            {formData.isParent && <Check size={12} className="text-white" strokeWidth={4} />}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-primary transition-colors">Is Parent</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="hidden" checked={formData.isSubParent} onChange={e => setFormData({...formData, isSubParent: e.target.checked, isParent: false, subParentId: null})} />
                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isSubParent ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-white border-slate-200 group-hover:border-orange-400'}`}>
                                            {formData.isSubParent && <Check size={12} className="text-white" strokeWidth={4} />}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-orange-500 transition-colors">Is Sub-Parent</span>
                                    </label>

                                    <div className="flex-1" />

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest transition-colors">Active Status</span>
                                        <input type="checkbox" className="hidden" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                                        <div className={`w-10 h-5 rounded-full transition-all relative p-1 ${formData.active ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full transition-all shadow-sm ${formData.active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {!formData.isParent && (
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 px-1">Parent Module</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner appearance-none"
                                            value={formData.subParentId || formData.parentId || ""}
                                            onChange={e => {
                                                const selectedId = e.target.value;
                                                if (!selectedId) {
                                                    setFormData({...formData, parentId: null, subParentId: null});
                                                    return;
                                                }
                                                const selectedModule = modules.find(m => m.id === selectedId);
                                                if (selectedModule.isSubParent) {
                                                    setFormData({
                                                        ...formData, 
                                                        parentId: selectedModule.parentModule?.id || null,
                                                        subParentId: selectedModule.id
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData, 
                                                        parentId: selectedModule.id,
                                                        subParentId: null
                                                    });
                                                }
                                            }}
                                        >
                                            <option value="">None (Top Level)</option>
                                            {modules.filter(m => {
                                                // If we are creating/editing a Sub-Parent, only show Parents
                                                if (formData.isSubParent) return m.isParent && m.id !== editingModule?.id;
                                                // If we are creating/editing a Link (child), show both Parents and Sub-Parents
                                                if (!formData.isParent && !formData.isSubParent) {
                                                    return (m.isParent || m.isSubParent) && m.id !== editingModule?.id;
                                                }
                                                // Parents shouldn't have any parent
                                                return false;
                                            }).map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.moduleName} {m.isParent ? '(Parent)' : '(Sub-Parent)'}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 px-1">
                                    Icon Library Class <span className="text-primary normal-case font-bold ml-1">(Lucide Class Name)</span>
                                </label>
                                <input 
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                    value={formData.iconCss || ""}
                                    onChange={e => setFormData({...formData, iconCss: e.target.value})}
                                    placeholder="e.g. layout, shield-check"
                                />
                            </div>

                            <div className="col-span-2 flex gap-4 mt-2">
                                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-primary transition-all active:scale-95">
                                    {editingModule ? 'Update Module' : 'Create Module'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
