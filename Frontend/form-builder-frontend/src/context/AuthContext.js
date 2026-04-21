import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENDPOINTS } from "../config/apiConfig";
import apiClient from "../utils/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const res = await apiClient.get(ENDPOINTS.AUTH_ME);
            setUser(res.data.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);



    const logout = async () => {
        try {
            await apiClient.post(ENDPOINTS.AUTH_LOGOUT);
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
            // Fallback: clear state and redirect even if server call fails
            setUser(null);
            router.push("/login");
        }
    };

    const hasPermission = (path) => {
        if (!user) return false;
        
        // Profiles and root/dashboard usually accessible to all authenticated users
        if (path === "/" || path.startsWith("/profile") || path === "/docs" || path === "/dashboard") return true;
        
        const permissions = user.permissions || [];
        
        // Multi-level checks for forms
        const hasFormsVaultAccess = permissions.includes("/forms/all");
        if (hasFormsVaultAccess) {
            const protectedFormPaths = ["/forms/edit/", "/forms/data/", "/forms/create", "/forms/edit", "/forms/all"];
            if (protectedFormPaths.some(bp => path.startsWith(bp)) || /^\/forms\/[a-f0-9-]+\/versions$/.test(path)) {
                return true;
            }
        }

        // Exact match or prefix match for other permissions
        return permissions.some(p => {
            if (p === "/") return path === "/";
            return path.startsWith(p);
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, refetchAuth: fetchUser, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
