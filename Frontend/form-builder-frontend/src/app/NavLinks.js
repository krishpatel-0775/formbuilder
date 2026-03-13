"use client";

import { useAuth } from "../context/AuthContext";
import NextLink from "next/link";
import { LogOut, User, LogIn, UserPlus } from "lucide-react";

export default function NavLinks() {
    const { user, logout } = useAuth();

    return (
        <div className="flex items-center gap-2">
            {user ? (
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-3">
                        <span className="text-sm font-black text-slate-900 tracking-tight bg-slate-50/50 px-4 py-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
                            {user.username}
                        </span>
                    </div>
                    
                    <NextLink href="/profile" className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                        <User size={20} />
                    </NextLink>

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <button 
                        onClick={logout}
                        className="group flex items-center justify-center h-10 w-10 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                        title="Logout"
                    >
                        <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <NextLink 
                        href="/login" 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        <LogIn size={16} />
                        Sign In
                    </NextLink>
                    <NextLink 
                        href="/register" 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <UserPlus size={16} />
                        Get Started
                    </NextLink>
                </div>
            )}
        </div>
    );
}
