"use client";
import { useAuth } from "../context/AuthContext";
import NextLink from "next/link";
import { LogOut } from "lucide-react";

export default function NavLinks() {
    const { user, loading, logout } = useAuth();

    if (loading) return <div style={linkGroupStyle}></div>;

    return (
        <div style={linkGroupStyle}>
            {user ? (
                <>
                    <NextLink href="/" style={navLinkStyle}>Builder</NextLink>
                    <NextLink href="/forms/all" style={ctaLinkStyle}>My Forms</NextLink>
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
