"use client";

import { AuthProvider } from "../context/AuthContext";
import { TeamProvider } from "../context/TeamContext";

export default function Providers({ children }) {
    return (
        <AuthProvider>
            <TeamProvider>
                {children}
            </TeamProvider>
        </AuthProvider>
    );
}
