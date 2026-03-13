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
                setUser(data.data); // data is now { id, username, email, roles }
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
            const isPublicForm = pathname.match(/^\/forms\/\d+$/);

            if (!user && !publicPaths.includes(pathname) && !isPublicForm) {
                router.push("/login");
            } else if (user) {
                const firstPath = getFirstAvailablePath(user.permittedModules) || "/login";
                
                if (publicPaths.includes(pathname)) {
                    router.push(firstPath);
                } else if (!isPublicForm) {
                    // Check module-level access
                    const hasAccess = checkPathAccess(pathname, user.permittedModules);
                    if (!hasAccess) {
                        console.warn(`Access denied to ${pathname}. Redirecting to ${firstPath}...`);
                        router.push(firstPath);
                    }
                }
            }
        }
    }, [user, loading, pathname, router]);

    const getFirstAvailablePath = (modules) => {
        if (!modules) return null;
        for (const m of modules) {
            if (m.prefix && m.prefix !== "#") return m.prefix;
            if (m.children) {
                const childPath = getFirstAvailablePath(m.children);
                if (childPath) return childPath;
            }
        }
        return null;
    };

    const checkPathAccess = (path, modules) => {
        if (!modules) return false;
        
        // Flatten modules to check prefixes
        const allPrefixes = [];
        const flatten = (items) => {
            items.forEach(item => {
                if (item.prefix && item.prefix !== "#") allPrefixes.push(item.prefix);
                if (item.children) flatten(item.children);
            });
        };
        flatten(modules);

        const hasFormPermission = allPrefixes.some(p => p.startsWith("/forms") || p === "/");

        // Strict access check
        return allPrefixes.some(prefix => {
            if (prefix === "/") return path === "/";
            
            // Allow sub-routes for forms if user has any form-related module
            if (hasFormPermission && (path.startsWith("/forms/edit") || path.startsWith("/forms/data"))) {
                return true;
            }

            return path.startsWith(prefix);
        });
    };

    const logout = async () => {
        try {
            await fetch(ENDPOINTS.AUTH_LOGOUT, { method: "POST", credentials: "include" });
            setUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const hasRole = (roleName) => {
        return user?.roles?.includes(roleName);
    };

    return (
        <AuthContext.Provider value={{ user, loading, refetchAuth: fetchUser, logout, hasRole, checkPathAccess }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
