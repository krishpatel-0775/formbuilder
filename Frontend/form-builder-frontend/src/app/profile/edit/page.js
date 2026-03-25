"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE_URL, ENDPOINTS } from "../../../config/apiConfig";
import { ArrowLeft, Loader2, User, Mail, Phone, Camera, Save, ShieldCheck } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
    const { user, refetchAuth } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setFullName(user.fullName || "");
            setEmail(user.email || "");
            setPhoneNumber(user.phoneNumber || "");
            if (user.profilePictureUrl) {
                setPreviewUrl(`${API_BASE_URL}${user.profilePictureUrl}`);
            }
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const formData = new FormData();
        const requestData = {
            username,
            fullName,
            email,
            phoneNumber
        };

        // Spring Boot expects the JSON part as a Blob with application/json type for @RequestPart
        formData.append("request", new Blob([JSON.stringify(requestData)], { type: "application/json" }));
        
        if (profilePicture) {
            formData.append("profilePicture", profilePicture);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
                method: "PUT",
                body: formData,
                credentials: "include"
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess("Profile updated successfully!");
                await refetchAuth();
                setTimeout(() => router.push("/profile"), 1500);
            } else {
                setError(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            setError("Network error occurred.");
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
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shadow-inner group-hover:border-primary/30 transition-all">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <User size={64} strokeWidth={1} />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <Camera color="white" size={32} />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                id="profile-picture" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                            <label 
                                htmlFor="profile-picture" 
                                className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 border-4 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                            >
                                <Camera size={18} />
                            </label>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click icon to change photo</p>
                    </div>

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
