"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Shield, X, Check, Search } from "lucide-react";

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [assignedModuleIds, setAssignedModuleIds] = useState([]);
    const [formData, setFormData] = useState({
        roleName: "",
        roleDescription: ""
    });

    useEffect(() => {
        fetchRoles();
        fetchModules();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch("http://localhost:9090/api/roles", { credentials: "include" });
            const data = await res.json();
            if (data.success) setRoles(data.data);
        } catch (err) { console.error("Error fetching roles:", err); }
        finally { setLoading(false); }
    };

    const fetchModules = async () => {
        try {
            const res = await fetch("http://localhost:9090/api/modules", { credentials: "include" });
            const data = await res.json();
            if (data.success) setModules(data.data);
        } catch (err) { console.error("Error fetching modules:", err); }
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        const url = editingRole ? `http://localhost:9090/api/roles/${editingRole.id}` : "http://localhost:9090/api/roles";
        const method = editingRole ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                fetchRoles();
                setShowModal(false);
                setFormData({ roleName: "", roleDescription: "" });
                setEditingRole(null);
            }
        } catch (err) { console.error("Error saving role:", err); }
    };

    const openMapping = async (role) => {
        setSelectedRole(role);
        try {
            const res = await fetch(`http://localhost:9090/api/roles/${role.id}/modules`, { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setAssignedModuleIds(data.data.map(m => m.id));
                setShowMappingModal(true);
            }
        } catch (err) { console.error("Error fetching assigned modules:", err); }
    };

    const handleSaveMapping = async () => {
        try {
            const res = await fetch(`http://localhost:9090/api/roles/${selectedRole.id}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(assignedModuleIds)
            });
            const data = await res.json();
            if (data.success) {
                setShowMappingModal(false);
            }
        } catch (err) { console.error("Error saving mapping:", err); }
    };

    const toggleModule = (id) => {
        setAssignedModuleIds(prev => 
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    if (loading) return <div className="p-8">Loading roles...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Role Management</h1>
                    <p className="text-slate-500 text-sm">Define roles and map them to restricted modules.</p>
                </div>
                <button 
                    onClick={() => { setEditingRole(null); setFormData({ roleName: "", roleDescription: "" }); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                    <Plus size={18} /> Add New Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingRole(role); setFormData({ roleName: role.roleName, roleDescription: role.roleDescription }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all">
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                            <Shield size={24} />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight mb-2">{role.roleName}</h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2">{role.roleDescription || "No description provided."}</p>
                        <button 
                            onClick={() => openMapping(role)}
                            className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                            Manage Permissions
                        </button>
                    </div>
                ))}
            </div>

            {/* Role Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSaveRole} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Role Name</label>
                                <input 
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                    value={formData.roleName}
                                    onChange={e => setFormData({...formData, roleName: e.target.value})}
                                    placeholder="e.g. System Admin"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all h-24"
                                    value={formData.roleDescription}
                                    onChange={e => setFormData({...formData, roleDescription: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Save Role</button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-[20px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Role-Module Mapping Modal */}
            {showMappingModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Permissions: {selectedRole?.roleName}</h2>
                                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Select modules accessible by this role</p>
                            </div>
                            <button onClick={() => setShowMappingModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="grid grid-cols-1 gap-3">
                                {modules.map(mod => (
                                    <div 
                                        key={mod.id} 
                                        onClick={() => toggleModule(mod.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${assignedModuleIds.includes(mod.id) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${assignedModuleIds.includes(mod.id) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 group-hover:text-blue-500'}`}>
                                                {mod.iconCss ? <i className={mod.iconCss}></i> : mod.moduleName[0]}
                                            </div>
                                            <div>
                                                <p className={`font-bold transition-colors ${assignedModuleIds.includes(mod.id) ? 'text-blue-700' : 'text-slate-600'}`}>{mod.moduleName}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{mod.parent ? 'Parent' : mod.subParent ? 'Category' : 'Direct Link'}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${assignedModuleIds.includes(mod.id) ? 'bg-blue-600 text-white scale-110' : 'border-2 border-slate-200 bg-white'}`}>
                                            {assignedModuleIds.includes(mod.id) && <Check size={14} strokeWidth={4} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-[32px] flex gap-4">
                            <button onClick={handleSaveMapping} className="flex-1 py-4 bg-blue-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Apply Permissions</button>
                            <button onClick={() => setShowMappingModal(false)} className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-[20px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
