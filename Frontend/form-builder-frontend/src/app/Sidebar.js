"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import NextLink from "next/link";
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
    LucideIcon
} from "lucide-react";

// Helper to map icon names to Lucide icons
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

export default function Sidebar() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMenu();
        }
    }, [user]);

    const fetchMenu = async () => {
        try {
            const res = await fetch("http://localhost:9090/api/menu", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setMenuItems(data.data);
            }
        } catch (err) {
            console.error("Error fetching menu:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (id) => {
        setExpandedGroups(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (!user) return null;

    return (
        <aside style={sidebarStyle}>
            <div style={sidebarHeaderStyle}>
                <p style={headerLabelStyle}>Navigational Core</p>
            </div>
            
            <div style={menuContainerStyle}>
                {loading ? (
                    <div className="flex flex-col gap-4 p-4 animate-pulse">
                        <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                        <div className="h-10 bg-slate-100 rounded-xl w-3/4"></div>
                    </div>
                ) : menuItems.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center">
                            Welcome to the Core
                        </p>
                        <button 
                            disabled={loading}
                            onClick={async (e) => {
                                const btn = e.currentTarget;
                                const originalText = btn.innerText;
                                btn.innerText = "Initializing...";
                                btn.disabled = true;
                                try {
                                    const res = await fetch("http://localhost:9090/api/modules/seed", { 
                                        method: "POST",
                                        credentials: "include"
                                    });
                                    if (res.ok) {
                                        btn.innerText = "Success!";
                                        setTimeout(() => fetchMenu(), 500);
                                    } else {
                                        btn.innerText = "Error!";
                                        setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
                                    }
                                } catch (err) { 
                                    console.error("Seed error:", err); 
                                    btn.innerText = "Failed!";
                                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
                                }
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Setup System
                        </button>
                    </div>
                ) : (
                    menuItems.map(item => {
                        const IconComponent = item.icon && iconMap[item.icon] ? iconMap[item.icon] : ChevronRight;
                        return (
                            <div key={item.id} style={menuGroupStyle}>
                                <div 
                                    style={groupHeaderStyle(expandedGroups[item.id])}
                                    onClick={() => toggleGroup(item.id)}
                                >
                                    <div style={iconWrapperStyle}>
                                        <IconComponent size={16} />
                                    </div>
                                    <span style={groupTextStyle}>{item.name}</span>
                                    <div style={chevronWrapperStyle(expandedGroups[item.id])}>
                                        <ChevronDown size={14} />
                                    </div>
                                </div>

                                {expandedGroups[item.id] && item.children && (
                                    <div style={subMenuContainerStyle}>
                                        {item.children.map(child => (
                                            <div key={child.id}>
                                                {child.isSubParent ? (
                                                    <div style={subGroupStyle}>
                                                        <p style={subGroupHeaderStyle}>{child.name}</p>
                                                        {child.children && child.children.map(subChild => (
                                                            <NextLink 
                                                                key={subChild.id}
                                                                href={subChild.prefix || "#"}
                                                                style={subNavLinkStyle}
                                                            >
                                                                {subChild.name}
                                                            </NextLink>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <NextLink 
                                                        href={child.prefix || "#"}
                                                        style={navLinkStyle}
                                                    >
                                                        {child.name}
                                                    </NextLink>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </aside>
    );
}

// --- Styles ---

const sidebarStyle = {
    width: "280px",
    height: "calc(100vh - 64px)",
    backgroundColor: "#ffffff",
    borderRight: "1px solid rgba(0, 0, 0, 0.05)",
    overflowY: "auto",
    position: "fixed",
    left: 0,
    top: "64px",
    padding: "24px",
    zIndex: 900,
};

const sidebarHeaderStyle = {
    marginBottom: "32px",
    padding: "0 8px",
};

const headerLabelStyle = {
    fontSize: "0.65rem",
    fontWeight: "900",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    margin: 0,
};

const menuContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
};

const menuGroupStyle = {
    display: "flex",
    flexDirection: "column",
};

const groupHeaderStyle = (expanded) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: expanded ? "#f8fafc" : "transparent",
    color: expanded ? "#2563eb" : "#64748b",
});

const groupTextStyle = {
    fontSize: "0.85rem",
    fontWeight: "700",
    flex: 1,
};

const iconWrapperStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const chevronWrapperStyle = (expanded) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s",
    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
    opacity: 0.5,
});

const subMenuContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingLeft: "44px",
    marginTop: "4px",
    borderLeft: "1px solid #f1f5f9",
    marginLeft: "24px",
};

const navLinkStyle = {
    display: "block",
    padding: "8px 12px",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#64748b",
    textDecoration: "none",
    borderRadius: "8px",
    transition: "all 0.2s",
};

const subGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    paddingTop: "8px",
    paddingBottom: "8px",
};

const subGroupHeaderStyle = {
    fontSize: "0.7rem",
    fontWeight: "900",
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 8px 12px",
};

const subNavLinkStyle = {
    display: "block",
    padding: "6px 12px",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#94a3b8",
    textDecoration: "none",
    borderRadius: "8px",
    transition: "all 0.2s",
};
