"use client";

import { useAuth } from "../../context/AuthContext";
import { User, Mail, Shield, Briefcase } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Profile Identity Card */}
                <div className="text-center space-y-6">
                    <div className="relative inline-block">
                        <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto shadow-sm">
                            <User size={64} strokeWidth={1} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 border-4 border-white">
                            <Shield size={18} />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.username}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Registry Identifier</p>
                    </div>
                </div>

                {/* Information Cluster */}
                <div className="space-y-4">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 transition-all hover:bg-slate-50">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Communication</p>
                                <p className="font-bold text-slate-700 tracking-tight">{user.email || "internal@system.arch"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 transition-all hover:bg-slate-50">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Organizational Role</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user.roles?.length > 0 ? user.roles.map((role, idx) => (
                                        <span key={idx} className="font-bold text-slate-900 tracking-tight">
                                            {role.replace(/_/g, " ")}
                                            {idx < user.roles.length - 1 && <span className="text-slate-300 ml-2">/</span>}
                                        </span>
                                    )) : (
                                        <span className="font-bold text-slate-500">Standard User</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                        Authorized Access Only
                    </p>
                </div>
            </div>
        </div>
    );
}
