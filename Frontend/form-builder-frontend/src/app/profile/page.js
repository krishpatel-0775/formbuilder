"use client";

import { useAuth } from "../../context/AuthContext";
import { User, Mail, Shield, Briefcase, Phone, Edit3 } from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig";
import NextLink from "next/link";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Profile Identity Card */}
                <div className="text-center space-y-6">
                    <div className="relative inline-block group">
                        <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10">
                            {user.profilePictureUrl ? (
                                <img
                                    src={`${API_BASE_URL}${user.profilePictureUrl}`}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User size={64} strokeWidth={1} />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 border-4 border-white">
                            <Shield size={18} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.fullName || user.username}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">@{user.username}</p>
                    </div>

                    <div className="flex justify-center pt-2">
                        <NextLink
                            href="/profile/edit"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                        >
                            <Edit3 size={16} />
                            Edit Profile
                        </NextLink>
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

                    {user.phoneNumber && (
                        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 transition-all hover:bg-slate-50">
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Phone Number</p>
                                    <p className="font-bold text-slate-700 tracking-tight">{user.phoneNumber}</p>
                                </div>
                            </div>
                        </div>
                    )}

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
