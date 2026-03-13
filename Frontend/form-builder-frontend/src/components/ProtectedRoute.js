"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
                return;
            }

            // Check if the current route is allowed
            // We'll consider a route allowed if it's in user.permissions
            // Special case: homepage "/" might be allowed for creators
            // /forms/all might be default
            
            const isAuthorized = (path) => {
                if (path === "/login" || path === "/register" || path === "/forms/all" || path === "/") return true;
                
                // Check if path starts with any of the permitted prefixes
                return user.permissions?.some(p => path.startsWith(p));
            };

            if (!isAuthorized(pathname)) {
                console.warn(`Access denied for ${pathname}`);
                router.push("/forms/all"); // Redirect to a safe place
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
    }

    return user ? children : null;
};

export default ProtectedRoute;
