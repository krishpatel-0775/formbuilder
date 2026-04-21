"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE_URL, ENDPOINTS } from "../../../config/apiConfig";
import { ArrowLeft, Loader2, User, Mail, Phone, Save, ShieldCheck } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "../../../utils/apiClient";

export default function EditProfilePage() {
    const { user, refetchAuth } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setFullName(user.fullName || "");
            setEmail(user.email || "");
            setPhoneNumber(user.phoneNumber || "");
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const requestData = {
            username,
            fullName,
            email,
            phoneNumber
        };

        try {
            const res = await apiClient.put(`/api/v1/auth/profile`, requestData);

            if (res.data.success) {
                setSuccess("Profile updated successfully!");
                await refetchAuth();
                setTimeout(() => router.push("/profile"), 1500);
            } else {
                setError(res.data.message || "Failed to update profile");
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-xl border border-slate-100 z-10 relative overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <NextLink href="/profile" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                            <ArrowLeft size={18} />
                        </NextLink>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile</h1>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Update your identity</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-start gap-3">
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 flex items-start gap-3">
                            <ShieldCheck size={20} />
                            <p className="text-sm font-bold">{success}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={16} />
                                </span>
                                <input 
                                    type="text" 
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)} 
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-11 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">@</span>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-11 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail size={16} />
                                </span>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-11 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Phone size={16} />
                                </span>
                                <input 
                                    type="tel" 
                                    value={phoneNumber} 
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-11 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white p-4 rounded-2xl text-sm font-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {loading ? "Saving Changes..." : "Save Profile Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
