"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    ChevronDown, 
    ChevronRight, 
    FileText, 
    Users, 
    Shield, 
    Settings,
    PlusCircle,
    List,
    MessageSquare,
    UserPlus,
    UserMinus,
    LucideIcon,
    Flame
} from "lucide-react";

const iconMap = {
    "layout": LayoutDashboard,
    "file-text": FileText,
    "users": Users,
    "shield": Shield,
    "settings": Settings,
    "plus-circle": PlusCircle,
    "list": List,
    "message-square": MessageSquare,
    "user-plus": UserPlus,
    "user-minus": UserMinus
};

export default function Sidebar({ isCollapsed, onTypeSelect, setIsCollapsed }) {
    const { user } = useAuth();
    const pathname = usePathname();
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

    const toggleGroup = (id) => {
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
                            const IconComponent = item.icon && iconMap[item.icon] ? iconMap[item.icon] : ChevronRight;
                            const isExpanded = expandedGroups[item.id] && !isCollapsed;
                            
                            return (
                                <div key={item.id} className="flex flex-col gap-1 w-full">
                                    <button 
                                        onClick={() => toggleGroup(item.id)}
                                        title={isCollapsed ? item.name : ""}
                                        className={`flex items-center rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group overflow-hidden ${isCollapsed ? "justify-center p-3.5" : "gap-3 px-4 py-3"} ${
                                            isExpanded ? "bg-slate-50 text-slate-900 border border-slate-100 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                                        }`}
                                    >
                                        <div className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0 ${
                                            isExpanded || isCollapsed ? "text-primary scale-110" : "group-hover:text-primary group-hover:scale-110"
                                        }`}>
                                            <IconComponent size={22} strokeWidth={2.5} />
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <span className="text-sm font-bold flex-1 text-left truncate tracking-tight animate-in fade-in duration-500">{item.name}</span>
                                                <ChevronDown 
                                                    size={14} 
                                                    className={`transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] opacity-40 ${isExpanded ? "rotate-180" : ""}`}
                                                />
                                            </>
                                        )}
                                    </button>

                                    {isExpanded && !isCollapsed && item.children && (
                                        <div className="ml-6 pl-4 border-l-2 border-slate-100/50 flex flex-col gap-1 mt-1 mb-2 animate-in slide-in-from-left duration-500">
                                            {item.children.map(child => {
                                                const isActive = pathname === child.prefix;
                                                
                                                if (child.isSubParent) {
                                                    return (
                                                        <div key={child.id} className="mt-3 mb-1">
                                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] mb-2 ml-3 truncate transition-all duration-500">
                                                                {child.name}
                                                            </p>
                                                            <div className="flex flex-col gap-1">
                                                                {child.children && child.children.map(subChild => {
                                                                    const isSubActive = pathname === subChild.prefix;
                                                                    return (
                                                                        <NextLink 
                                                                            key={subChild.id}
                                                                            href={subChild.prefix || "#"}
                                                                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-500 truncate border border-transparent ${
                                                                                isSubActive 
                                                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                                                                : "text-slate-400 hover:text-primary hover:bg-slate-50"
                                                                            }`}
                                                                        >
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
                                                        className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-500 truncate border border-transparent ${
                                                            isActive 
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                                            : "text-slate-500 hover:text-primary hover:bg-slate-50"
                                                        }`}
                                                    >
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
                        <ChevronRight size={20} strokeWidth={2.5} />
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
