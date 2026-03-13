"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminGuard({ children }) {
    const { user, loading, hasRole, checkPathAccess } = useAuth();
    const router = useRouter();
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="p-8 h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Verifying Permissions</p>
            </div>
        );
    }

    const hasModuleAccess = user && checkPathAccess(pathname, user.permittedModules);

    if (!user || (!hasRole("SYSTEM_ADMIN") && !hasModuleAccess)) {
        return (
            <div className="p-8 h-screen flex flex-col items-center justify-center bg-white text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-red-100/50">
                    <ShieldAlert size={40} strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Access Denied</h1>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                    You do not have the required permissions to access this administrative module. 
                    Please contact your system administrator.
                </p>
                <button 
                    onClick={() => router.push("/forms/all")}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
