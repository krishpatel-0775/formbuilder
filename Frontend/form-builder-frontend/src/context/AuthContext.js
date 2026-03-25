import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ENDPOINTS } from "../config/apiConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const res = await fetch(ENDPOINTS.AUTH_ME, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setUser(data.data); // data is adminId
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [pathname]); // Re-check auth occasionally or on route change

    useEffect(() => {
        if (!loading) {
            const publicPaths = ["/login", "/register"];
            const isPublicForm = pathname.match(/^\/forms\/[a-f0-9-]+$/);

            if (!user) {
                if (!publicPaths.includes(pathname) && !isPublicForm) {
                    router.push("/login");
                }
            } else {
                if (publicPaths.includes(pathname)) {
                    // Redirect to the first available permission or profile
                    const firstPermission = user.permissions?.[0] || "/profile";
                    router.push(firstPermission === "/" ? "/profile" : firstPermission);
                } else if (!isPublicForm) {
                    // RBAC Check for authenticated users on protected paths
                    const isAuthorized = (path) => {
                        // These paths are usually allowed for everyone who is logged in
                        if (path.startsWith("/profile")) return true;
                        
                        // Check if user has permission for forms management
                        const hasFormsVaultAccess = user.permissions?.includes("/forms/all");
                        const formsBasePaths = ["/forms/edit/", "/forms/data/", "/forms/create"];
                        const isVersionsPath = /^\/forms\/[a-f0-9-]+\/versions$/.test(path);
                        
                        if (hasFormsVaultAccess && (formsBasePaths.some(bp => path.startsWith(bp)) || isVersionsPath)) {
                            return true;
                        }

                        // Check if path starts with any of the permitted prefixes
                        return user.permissions?.some(p => {
                            if (p === "/") return path === "/"; // Home page (builder) must be exact match
                            return path.startsWith(p);
                        });
                    };

                    if (!isAuthorized(pathname)) {
                        console.warn(`Access denied for ${pathname}`);
                        const fallback = user.permissions?.[0] || "/profile";
                        router.push(fallback === "/" ? "/profile" : fallback);
                    }
                }
            }
        }
    }, [user, loading, pathname, router]);

    const logout = async () => {
        try {
            await fetch(ENDPOINTS.AUTH_LOGOUT, { method: "POST", credentials: "include" });
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const hasPermission = (path) => {
        if (!user) return false;
        if (path === "/" || path.startsWith("/profile")) return true;
        
        const permissions = user.permissions || [];
        const hasFormsVaultAccess = permissions.includes("/forms/all");
        const isVersionsPath = /^\/forms\/[a-f0-9-]+\/versions$/.test(path);
        if (hasFormsVaultAccess && (path.startsWith("/forms/edit/") || path.startsWith("/forms/data/") || path.startsWith("/forms/create") || isVersionsPath)) {
            return true;
        }

        return user.permissions?.some(p => {
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
