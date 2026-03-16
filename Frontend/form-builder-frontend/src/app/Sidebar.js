"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";

// Create a map for case-insensitive lookup of all Lucide icons
const lucideKeyMap = Object.keys(LucideIcons).reduce((acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
}, {});

// Alias map for short names or backward compatibility
const baseIconMap = {
    "layout": "LayoutDashboard",
    "file-text": "FileText",
    "users": "Users",
    "shield": "Shield",
    "settings": "Settings",
    "plus-circle": "PlusCircle",
    "list": "List",
    "message-square": "MessageSquare",
    "user-plus": "UserPlus",
    "user-minus": "UserMinus",
    "box": "LayoutDashboard",
    "flame": "Flame",
    "box-select": "LayoutDashboard"
};

export const DynamicIcon = ({ iconName, size = 22, className = "" }) => {
    if (!iconName) return <LucideIcons.ChevronRight size={size} className={className} />;
    
    const normalizedName = iconName.trim().toLowerCase();

    // 1. Check Alias Map first
    let searchKey = baseIconMap[normalizedName] || normalizedName;
    
    // 2. Normalize search key (remove dashes, underscores, spaces) for matching
    const matchKey = searchKey.replace(/[-_ ]/g, "").toLowerCase();

    // 3. Try to get the actual icon key from our case-insensitive map
    const actualLucideKey = lucideKeyMap[matchKey];
    const LucideIcon = LucideIcons[actualLucideKey];

    if (LucideIcon) {
        return <LucideIcon size={size} className={className} strokeWidth={2.5} />;
    }

    // 4. Fallback: Check if it looks like a CSS class (FontAwesome etc.)
    return <i className={`${iconName} ${className}`} style={{ fontSize: size }}></i>;
};

export default function Sidebar({ isCollapsed, onTypeSelect, setIsCollapsed }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [menuItems, setMenuItems] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.menu) {
            setMenuItems(user.menu);
            // Expand all parents by default
            const initialExpanded = {};
            user.menu.forEach(item => {
                initialExpanded[item.id] = true;
            });
            setExpandedGroups(initialExpanded);
            setLoading(false);
        }
    }, [user]);

    const toggleGroup = (id, prefix, shouldNavigate = true) => {
        // 1. Navigation handling (only if shouldNavigate is true)
        if (shouldNavigate && prefix && prefix !== "#" && pathname !== prefix) {
            router.push(prefix);
        }

        // 2. Expansion handling
        if (isCollapsed) {
            onTypeSelect(); // Expand the sidebar if it's collapsed
            return;
        }

        setExpandedGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (!user) return null;

    return (
        <aside className={`h-full flex flex-col bg-white overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "items-center" : ""}`}>
            <div className={`p-6 w-full flex-1 overflow-y-auto custom-scrollbar transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "px-2" : ""}`}>
                
                <nav className="space-y-4">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-11 bg-slate-100 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "w-11" : "w-full"}`}></div>
                            ))}
                        </div>
                    ) : (
                        menuItems.map(item => {
                            const isExpanded = expandedGroups[item.id] && !isCollapsed;
                            
                            return (
                                <div key={item.id} className="flex flex-col gap-1 w-full">
                                    <div 
                                        onClick={() => toggleGroup(item.id, item.prefix)}
                                        title={isCollapsed ? item.name : ""}
                                        className={`flex items-center rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group overflow-hidden ${isCollapsed ? "justify-center p-3.5" : "gap-3 px-4 py-3"} ${
                                            isExpanded ? "bg-slate-50 text-slate-900 border border-slate-100 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                                        }`}
                                    >
                                        <div className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0 ${
                                            isExpanded || isCollapsed ? "text-primary scale-110" : "group-hover:text-primary group-hover:scale-110"
                                        }`}>
                                            <DynamicIcon iconName={item.icon} />
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <span className="text-sm font-bold flex-1 text-left truncate tracking-tight animate-in fade-in duration-500">{item.name}</span>
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent navigation click
                                                        toggleGroup(item.id, item.prefix, false); // Toggle ONLY expansion
                                                    }}
                                                    className={`p-2 -mr-2 rounded-xl hover:bg-slate-100 transition-colors duration-300 flex items-center justify-center ${isExpanded ? "text-primary" : "text-slate-400"}`}
                                                >
                                                    <LucideIcons.ChevronDown 
                                                        size={14} 
                                                        className={`transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? "rotate-180" : ""}`}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {isExpanded && !isCollapsed && item.children && (
                                        <div className="ml-6 pl-4 border-l-2 border-slate-100/50 flex flex-col gap-1 mt-1 mb-2 animate-in slide-in-from-left duration-500">
                                            {item.children.map(child => {
                                                const isActive = pathname === child.prefix;
                                                
                                                if (child.isSubParent) {
                                                    return (
                                                        <div key={child.id} className="mt-3 mb-1">
                                                            <div className="flex items-center gap-2 mb-2 ml-3">
                                                                <DynamicIcon iconName={child.icon} size={10} className="text-slate-300" />
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] truncate transition-all duration-500">
                                                                    {child.name}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                {child.children && child.children.map(subChild => {
                                                                    const isSubActive = pathname === subChild.prefix;
                                                                    return (
                                                                        <NextLink 
                                                                            key={subChild.id}
                                                                            href={subChild.prefix || "#"}
                                                                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-500 truncate border border-transparent cursor-pointer flex items-center gap-2 ${
                                                                                isSubActive 
                                                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                                                                : "text-slate-400 hover:text-primary hover:bg-slate-50"
                                                                            }`}
                                                                        >
                                                                            <DynamicIcon iconName={subChild.icon} size={14} className={isSubActive ? "text-white" : "text-slate-400 group-hover:text-primary"} />
                                                                            {subChild.name}
                                                                        </NextLink>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <NextLink 
                                                        key={child.id}
                                                        href={child.prefix || "#"}
                                                        className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-500 truncate border border-transparent cursor-pointer flex items-center gap-2 ${
                                                            isActive 
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                                            : "text-slate-500 hover:text-primary hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <DynamicIcon iconName={child.icon} size={14} className={isActive ? "text-white" : "text-slate-400 group-hover:text-primary"} />
                                                        {child.name}
                                                    </NextLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </nav>
            </div>

            {/* Premium Collapse Mechanic */}
            <div className={`p-4 mt-auto border-t border-slate-50 w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "px-2" : ""}`}>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`flex items-center gap-3 w-full p-3 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-primary transition-all duration-500 group ${isCollapsed ? "justify-center" : ""}`}
                >
                    <div className={`transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "rotate-180" : ""}`}>
                        <LucideIcons.ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                    {!isCollapsed && (
                        <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-500">Collapse Core</span>
                    )}
                </button>
            </div>
        </aside>
    );
}

// Custom styles for scrollbar if needed (already handled in globals.css)
