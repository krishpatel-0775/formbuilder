"use client";

import { useState, useEffect } from "react";
import { useTeam } from "../../context/TeamContext";
import { Users, Plus, Key, Shield, UserPlus, Check, X, ArrowRight, Settings, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function TeamsPage() {
    const { user } = useAuth();
    const { teams, activeTeam, userRole, createTeam, joinTeam, refetchTeams } = useTeam();
    const [teamName, setTeamName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [requests, setRequests] = useState([]);
    const [members, setMembers] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    
    const [directEmail, setDirectEmail] = useState("");
    const [directRole, setDirectRole] = useState("FORM_EDITOR");
    const [isAddingMember, setIsAddingMember] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (await createTeam(teamName)) {
            setTeamName("");
            setShowCreate(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        const result = await joinTeam(inviteCode);
        if (result.success) {
            alert("Join request sent!");
            setInviteCode("");
            setShowJoin(false);
        } else {
            alert(result.message);
        }
    };

    const fetchRequests = async () => {
        if (!activeTeam || userRole !== 'TEAM_ADMIN') return;
        setLoadingRequests(true);
        try {
            const res = await fetch(`http://localhost:9090/api/teams/${activeTeam.id}/requests`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchMembers = async () => {
        if (!activeTeam) return;
        try {
            const res = await fetch(`http://localhost:9090/api/teams/${activeTeam.id}/members`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setMembers(data.data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDirectAdd = async (e) => {
        e.preventDefault();
        if (!activeTeam) return;
        setIsAddingMember(true);
        try {
            const res = await fetch(`http://localhost:9090/api/teams/${activeTeam.id}/members?email=${directEmail}&role=${directRole}`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                alert("Member added successfully!");
                setDirectEmail("");
                fetchMembers();
            } else {
                const msg = await res.text();
                alert(msg || "Failed to add member");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        if (!activeTeam) return;
        try {
            const res = await fetch(`http://localhost:9090/api/teams/${activeTeam.id}/members/${userId}/role?role=${newRole}`, {
                method: "PUT",
                credentials: "include"
            });
            if (res.ok) {
                fetchMembers();
            } else {
                const msg = await res.text();
                alert(msg || "Failed to update role");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRequest = async (requestId, status) => {
        try {
            const res = await fetch(`http://localhost:9090/api/teams/requests/${requestId}?status=${status}`, {
                method: "PUT",
                credentials: "include"
            });
            if (res.ok) {
                fetchRequests();
                fetchMembers();
                refetchTeams();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!activeTeam || !window.confirm("Are you sure you want to remove this member from the team?")) return;
        try {
            const res = await fetch(`http://localhost:9090/api/teams/${activeTeam.id}/members/${userId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                fetchMembers();
            } else {
                const msg = await res.text();
                alert(msg || "Failed to remove member");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (activeTeam) {
            fetchRequests();
            fetchMembers();
        } else {
            setRequests([]);
            setMembers([]);
        }
    }, [activeTeam, userRole]);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] p-8 md:p-16">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Workspace <span className="text-blue-600">Command</span></h1>
                        <p className="text-slate-500 font-medium">Manage your collective intelligence and team dynamics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowJoin(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-blue-400 transition-all shadow-sm"
                        >
                            <Key size={18} className="text-slate-400" />
                            <span>Join Team</span>
                        </button>
                        <button 
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-xl"
                        >
                            <Plus size={18} />
                            <span>Create Team</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Team Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTeam ? (
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                                
                                <div className="relative">
                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                            <Shield size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900">{activeTeam.name}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Invite Code: {activeTeam.inviteCode}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requests Section - Only for TEAM_ADMIN */}
                                    {userRole === 'TEAM_ADMIN' && (
                                        <div className="mb-12">
                                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                                <UserPlus size={20} className="text-blue-500" />
                                                Pending Requests
                                            </h3>
                                            {requests.length === 0 ? (
                                                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                                                    <p className="text-slate-400 text-sm font-medium italic">No pending requests at the moment.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {requests.map(req => (
                                                        <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:border-blue-200">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400">
                                                                    {req.user.username[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">{req.user.username}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">{req.user.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleRequest(req.id, 'APPROVED')}
                                                                    className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRequest(req.id, 'REJECTED')}
                                                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Members Section */}
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <Users size={20} className="text-blue-500" />
                                            Team Members
                                        </h3>
                                        <div className="space-y-4">
                                            {members.map(m => (
                                                <div key={`${m.teamId}-${m.userId}`} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-blue-600">
                                                            {(m.user?.username || "?")[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{m.user?.username || `Member ID: ${m.userId}`}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{m.user?.email || "No email available"}</p>
                                                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{m.role}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {userRole === 'TEAM_ADMIN' && m.userId !== user?.id && (
                                                            <button 
                                                                onClick={() => handleRemoveMember(m.userId)}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Remove from Team"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                        {userRole === 'TEAM_ADMIN' && m.userId !== user?.id ? (
                                                            <select 
                                                                value={m.role}
                                                                onChange={(e) => handleRoleUpdate(m.userId, e.target.value)}
                                                                className="text-[10px] font-black uppercase bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500 transition-all cursor-pointer"
                                                            >
                                                                <option value="TEAM_ADMIN">TEAM_ADMIN</option>
                                                                <option value="DEVELOPER">DEVELOPER</option>
                                                                <option value="FORM_EDITOR">FORM_EDITOR</option>
                                                                <option value="TEAM_USER">TEAM_USER</option>
                                                            </select>
                                                        ) : (
                                                            <div className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-400">
                                                                {m.role}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm">
                                <Users size={64} className="text-slate-200 mx-auto mb-8" />
                                <h2 className="text-2xl font-black text-slate-900 mb-2">No active workspace selected</h2>
                                <p className="text-slate-400 font-medium mb-8">Select a team from the switcher or create a new one to get started.</p>
                            </div>
                        )}
                    </div>

                    {/* Team List Sidebar */}
                    <div className="space-y-8">
                        {userRole === 'TEAM_ADMIN' && (
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <UserPlus size={20} className="text-blue-500" />
                                    Direct Add
                                </h3>
                                <form onSubmit={handleDirectAdd} className="space-y-4">
                                    <input 
                                        type="email"
                                        placeholder="User email..."
                                        value={directEmail}
                                        onChange={(e) => setDirectEmail(e.target.value)}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                        required
                                    />
                                    <select 
                                        value={directRole}
                                        onChange={(e) => setDirectRole(e.target.value)}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="DEVELOPER">DEVELOPER</option>
                                        <option value="FORM_EDITOR">FORM_EDITOR</option>
                                        <option value="TEAM_USER">TEAM_USER</option>
                                    </select>
                                    <button 
                                        type="submit"
                                        disabled={isAddingMember}
                                        className="w-full h-12 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {isAddingMember ? 'Adding...' : 'Add Member'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Users size={20} className="text-blue-500" />
                                Your Teams
                            </h3>
                            <div className="space-y-3">
                                {teams.map(t => (
                                    <div 
                                        key={t.teamId}
                                        className={`p-4 rounded-[1.5rem] border transition-all ${activeTeam?.id === t.teamId ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/5' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-black tracking-tight ${activeTeam?.id === t.teamId ? 'text-blue-900' : 'text-slate-900'}`}>{t.team.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.role}</p>
                                            </div>
                                            {activeTeam?.id === t.teamId && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showCreate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Create <span className="text-blue-600">Team</span></h3>
                        <p className="text-slate-500 text-sm mb-8 font-medium">Build a new environment for collaboration.</p>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Team Identity</label>
                                <input 
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                                    placeholder="Enter team name..."
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 h-14 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                >
                                    Initialize <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showJoin && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Join <span className="text-indigo-600">Workspace</span></h3>
                        <p className="text-slate-500 text-sm mb-8 font-medium">Enter a unique code to request access.</p>
                        <form onSubmit={handleJoin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Access Token</label>
                                <input 
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                    placeholder="Paste invite code..."
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowJoin(false)}
                                    className="flex-1 h-14 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                                >
                                    Verify <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
