"use client";

import { useAuth } from "../context/AuthContext";
import { useTeam } from "../context/TeamContext";
import NextLink from "next/link";
import { LogOut, Users, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

export default function NavLinks() {
    const { user, loading, logout } = useAuth();
    const { teams, activeTeam, switchTeam, createTeam } = useTeam();
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);

    if (loading) return <div style={linkGroupStyle}></div>;

    return (
        <div style={linkGroupStyle}>
            {user ? (
                <>
                    {/* Team Switcher */}
                    <div className="relative group" style={{ position: "relative" }}>
                        <button 
                            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:border-blue-400 transition-all"
                        >
                            <Users size={14} className="text-blue-500" />
                            <span>{activeTeam ? activeTeam.name : "Select Team"}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${showTeamDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showTeamDropdown && (
                            <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[2000] animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-2 mb-1">Your Teams</p>
                                {teams.map((t) => (
                                    <button
                                        key={t.teamId}
                                        onClick={() => {
                                            switchTeam(t.teamId);
                                            setShowTeamDropdown(false);
                                        }}
                                        className={`flex items-center justify-between w-full p-3 rounded-xl text-left transition-all mb-1 ${activeTeam?.id === t.teamId ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{t.team.name}</span>
                                            <span className="text-[9px] font-medium opacity-60 uppercase">{t.role}</span>
                                        </div>
                                        {activeTeam?.id === t.teamId && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        )}
                                    </button>
                                ))}
                                <div className="border-t border-slate-100 mt-2 pt-2">
                                    <NextLink 
                                        href="/teams" 
                                        onClick={() => setShowTeamDropdown(false)}
                                        className="flex items-center gap-2 w-full p-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 text-xs font-bold transition-all"
                                    >
                                        <Plus size={14} />
                                        <span>Manage Teams</span>
                                    </NextLink>
                                </div>
                            </div>
                        )}
                    </div>

                    <NextLink href="/" style={navLinkStyle}>Builder</NextLink>
                    <NextLink href="/forms/all" style={ctaLinkStyle}>Vault</NextLink>
                    <button onClick={logout} className="flex items-center gap-2 text-red-500 font-bold hover:text-red-700 transition" style={{ ...navLinkStyle, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                        <LogOut size={16} /> Logout
                    </button>
                </>
            ) : (
                <>
                    <NextLink href="/login" style={navLinkStyle}>Login</NextLink>
                    <NextLink href="/register" style={ctaLinkStyle}>Register</NextLink>
                </>
            )}
        </div>
    );
}

const linkGroupStyle = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
};

const navLinkStyle = {
    color: "#64748b",
    textDecoration: "none",
    fontSize: "0.75rem",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "color 0.2s",
};

const ctaLinkStyle = {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: "800",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.1)",
};
