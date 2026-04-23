"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/apiConfig";
import { ArrowRight, Loader2, Link as LinkIcon, ShieldAlert } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../../utils/apiClient";
import { useEffect } from "react";

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { refetchAuth } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("expired") === "true") {
            setError("Your session has expired. Please log in again.");
        }
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await apiClient.post(ENDPOINTS.AUTH_LOGIN, { identifier, password });

            if (res.data.success) {
                await refetchAuth();
                router.push("/forms/all");
            } else {
                setError(res.data.message || "Invalid credentials");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 blur-[100px] rounded-full point-events-none" />
            <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 z-10 relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                        <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Please enter your details to sign in.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                        <ShieldAlert size={18} className="mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Username or Email</label>
                        <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required
                            suppressHydrationWarning
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                            placeholder="hello@example.com" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            suppressHydrationWarning
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                            placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loading}
                        suppressHydrationWarning
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-violet-600 text-white p-4 rounded-xl text-sm font-black transition-all shadow-md hover:shadow-xl hover:shadow-violet-600/20 active:scale-[0.98] mt-2">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>

                <p className="text-center text-sm font-medium text-slate-500 mt-8">
                    Don't have an account? <NextLink href="/register" className="font-bold text-violet-600 hover:text-violet-700 transition-colors">Sign up</NextLink>
                </p>
            </div>
        </div>
    );
}
