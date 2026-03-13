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
            const isPublicForm = pathname.match(/^\/forms\/\d+$/); // /forms/[id] is public for respondents to fill

            if (!user && !publicPaths.includes(pathname) && !isPublicForm) {
                router.push("/login");
            } else if (user && publicPaths.includes(pathname)) {
                router.push("/forms/all");
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

    const hasRole = (roleName) => {
        return user?.roles?.includes(roleName);
    };

    return (
        <AuthContext.Provider value={{ user, loading, refetchAuth: fetchUser, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
