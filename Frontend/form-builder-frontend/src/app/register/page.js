"use client";

import { useState } from "react";
import { ENDPOINTS } from "../../config/apiConfig";
import { ArrowRight, Loader2, ShieldCheck, User, Phone } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import apiClient from "../../utils/apiClient";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const requestData = {
            username,
            fullName,
            email,
            phoneNumber,
            password
        };

        try {
            const res = await apiClient.post(ENDPOINTS.AUTH_REGISTER, requestData);

            if (res.data.success) {
                router.push("/login");
            } else {
                setError(res.data.message || "Registration failed");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#f8fafc] overflow-y-auto py-12 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full point-events-none" />
            <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 z-10 relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-black rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-black/20 mb-4">
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Sign up to start building dynamic forms.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Username</label>
                        <div className="relative">
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                                placeholder="admin123" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={16} />
                                </span>
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-10 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                                    placeholder="John Doe" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Phone size={16} />
                                </span>
                                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-10 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                                    placeholder="+1 234 567 890" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                            placeholder="you@company.com" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                            placeholder="••••••••" />
                    </div>


                    <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl text-sm font-black transition-all shadow-md hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] mt-4">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : "Complete Registration"}
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>

                <p className="text-center text-sm font-medium text-slate-500 mt-8">
                    Already have an account? <NextLink href="/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Sign in</NextLink>
                </p>
            </div>
        </div>
    );
}
