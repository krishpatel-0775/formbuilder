"use client";

import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import NavLinks from "./NavLinks";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function ClientLayout({ children }) {
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Toggle sidebar on mobile
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Toggle collapse on desktop
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    // Coordinate with right-side form builder panel
    useEffect(() => {
        const handleRightPanel = (e) => {
            if (e.detail?.isOpen) {
                // Force close left menubar to avoid overlap
                if (window.innerWidth >= 1024) setIsCollapsed(true);
                else setIsSidebarOpen(false);
            }
        };
        document.addEventListener("right-panel-state", handleRightPanel);
        return () => document.removeEventListener("right-panel-state", handleRightPanel);
    }, []);

    // Broadcast left menu state to children instantly
    useEffect(() => {
        const isMenuOpen = window.innerWidth >= 1024 ? !isCollapsed : isSidebarOpen;
        document.dispatchEvent(new CustomEvent("left-menu-state", { detail: { isOpen: isMenuOpen } }));
    }, [isCollapsed, isSidebarOpen]);

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
            {/* Header Navigation */}
            <header className="sticky top-0 z-[1000] w-full border-b bg-white/70 backdrop-blur-xl transition-all">
                <div className="flex h-16 items-center justify-between px-6 lg:px-10">
                    <div className="flex items-center gap-4 lg:gap-8">
                        {user && (
                            <button
                                onClick={window.innerWidth < 1024 ? toggleSidebar : toggleCollapse}
                                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-all hover:scale-110 active:scale-90"
                            >
                                {isSidebarOpen ? (isCollapsed ? <Menu size={20} /> : <X size={20} />) : <Menu size={20} />}
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h1 className={`text-lg font-black tracking-tighter text-slate-900 uppercase transition-all duration-300 ${isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible"}`}>
                                FormCraft <span className="ml-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">PRO</span>
                            </h1>
                        </div>
                    </div>

                    <NavLinks />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Global Sidebar Overlay Mobile */}
                {user && (
                    <div
                        className={`lg:hidden fixed inset-0 bg-slate-900/50 z-30 transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                        onClick={toggleSidebar}
                    />
                )}

                {/* Global Sidebar */}
                {user && (
                    <div
                        className={`fixed lg:relative inset-y-16 lg:inset-y-0 left-0 z-40 transform bg-white border-r transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 flex-shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                            } ${isCollapsed ? "w-20" : "w-[260px] lg:w-[288px] max-w-full"}`}
                    >
                        <Sidebar
                            isCollapsed={isCollapsed}
                            onTypeSelect={() => isCollapsed && setIsCollapsed(false)}
                            setIsCollapsed={setIsCollapsed}
                        />
                    </div>
                )}

                {/* Main Content */}
                <main
                    className={`flex-1 flex flex-col min-w-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] relative`}
                >
                    <div className="flex-1 overflow-hidden bg-mesh relative">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
