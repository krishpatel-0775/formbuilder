"use client";

import { useState, useEffect } from "react";
import { User, Shield, Check, X, Search, ChevronRight } from "lucide-react";
import { ENDPOINTS } from "../../../config/apiConfig";
import apiClient from "../../../utils/apiClient";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignedRoleIds, setAssignedRoleIds] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [uRes, rRes] = await Promise.all([
                apiClient.get(ENDPOINTS.USERS),
                apiClient.get(ENDPOINTS.ROLES)
            ]);

            if (uRes.data.success) setUsers(uRes.data.data);
            if (rRes.data.success) setRoles(rRes.data.data);
        } catch (err) {
            console.error("Error fetching user data:", err);
        } finally {
            setLoading(false);
        }
    };

    const openMapping = (user) => {
        setSelectedUser(user);
        setAssignedRoleIds(user.roleIds || []);
        setShowModal(true);
    };

    const toggleRole = (roleId) => {
        setAssignedRoleIds(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSaveMapping = async () => {
        try {
            const res = await apiClient.post(`${ENDPOINTS.USERS}/${selectedUser.id}/roles`, assignedRoleIds);
            if (res.data.success) {
                fetchData();
                setShowModal(false);
            }
        } catch (err) {
            console.error("Error saving roles:", err);
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="p-8 h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Synchronizing Users</p>
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Assign roles to users to control workspace access.</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="Search users..."
                        className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[24px] text-sm w-72 shadow-xl shadow-slate-200/50 focus:outline-none focus:border-blue-500 transition-all font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Roles</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-inner uppercase">
                                            {user.name ? user.name[0] : user.username[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 tracking-tight">{user.username}</p>
                                            <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roleIds.length > 0 ? (
                                            user.roleIds.map(rid => {
                                                const r = roles.find(role => role.id === rid);
                                                return r ? (
                                                    <span key={rid} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tight border border-blue-100/50">
                                                        {r.roleName}
                                                    </span>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-xs text-slate-300 font-medium italic">No roles assigned</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${user.roleIds.length > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}`} />
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            {user.roleIds.length > 0 ? 'Managed' : 'Restricted'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <button 
                                        onClick={() => openMapping(user)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                                    >
                                        Manage Access
                                        <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <User size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No users found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Role Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Permissions: {selectedUser?.username}</h2>
                                <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-widest">Select user's administrative and operational roles</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white bg-slate-50 rounded-2xl transition-all shadow-sm"><X size={20} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-4">
                            {roles.map(role => (
                                <div 
                                    key={role.id} 
                                    onClick={() => toggleRole(role.id)}
                                    className={`p-6 rounded-[28px] border-2 transition-all cursor-pointer flex items-center justify-between group h-24 ${assignedRoleIds.includes(role.id) ? 'bg-blue-50/50 border-blue-600' : 'bg-slate-50/50 border-transparent hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-sm ${assignedRoleIds.includes(role.id) ? 'bg-blue-600 text-white scale-110 shadow-blue-200' : 'bg-white text-slate-400 group-hover:text-blue-500'}`}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <p className={`font-black uppercase tracking-tight transition-colors ${assignedRoleIds.includes(role.id) ? 'text-blue-700' : 'text-slate-600'}`}>{role.roleName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-clamp-1">{role.roleDescription || 'Standard functional access'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center transition-all ${assignedRoleIds.includes(role.id) ? 'bg-blue-600 text-white rotate-0' : 'bg-white border-2 border-slate-100 opacity-50 group-hover:opacity-100 rotate-90 scale-90'}`}>
                                        {assignedRoleIds.includes(role.id) ? <Check size={18} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-10 border-t border-slate-100 bg-white flex gap-6">
                            <button onClick={handleSaveMapping} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0">
                                Apply Assignments
                            </button>
                            <button onClick={() => setShowModal(false)} className="px-10 py-5 bg-slate-50 text-slate-500 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-100 transition-all active:scale-95">
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
