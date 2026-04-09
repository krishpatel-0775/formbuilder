"use client";

import { useState, useEffect, useRef } from "react";
import { 
    BookOpen, 
    FileText, 
    Code, 
    Terminal, 
    Send, 
    ShieldCheck, 
    Zap, 
    AlertCircle, 
    ChevronRight,
    Copy,
    Check,
    Type, Hash, Mail, Calendar, Phone, Clock, Link, CircleDot, CheckSquare,
    ListPlus, ToggleLeft, Heading, Pilcrow, Minus, Layout, SeparatorHorizontal, Menu, X, Globe,
    Search, RefreshCw, Lock, Activity
} from "lucide-react";

const DOCS_VERSION = "v1.0.0";

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("overview");
    const [copiedId, setCopiedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTryingApi, setIsTryingApi] = useState(null);

    // Track if scrolling is caused by a manual click to avoid intersection observer jumps
    const isManualScrolling = useRef(false);

    const sections = [
        { id: "overview", label: "Overview", icon: BookOpen },
        { id: "metadata", label: "Metadata API", icon: FileText },
        { id: "components", label: "Components", icon: ListPlus },
        { id: "rules", label: "Rules Engine", icon: Zap },
        { id: "submission", label: "Submission API", icon: Send },
        { id: "errors", label: "Error Handling", icon: AlertCircle },
        { id: "upload", label: "File Upload Flow", icon: Layout },
        { id: "flow", label: "Complete Flow", icon: Zap },
        { id: "concepts", label: "Key Concepts", icon: Terminal },
        { id: "validation", label: "Validations", icon: AlertCircle },
        { id: "security", label: "Security", icon: ShieldCheck }
    ];

    const filteredSections = sections.filter(section => 
        section.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Trigger when section is in the upper middle of the screen
            threshold: 0
        };

        const observerCallback = (entries) => {
            if (isManualScrolling.current) return;

            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            isManualScrolling.current = true;
            element.scrollIntoView({ behavior: "smooth" });
            setActiveSection(id);
            setIsMobileMenuOpen(false);
            
            // Re-enable observer after smooth scroll completes
            setTimeout(() => {
                isManualScrolling.current = false;
            }, 800);
        }
    };

    const handleTryApi = (id) => {
        setIsTryingApi(id);
        setTimeout(() => setIsTryingApi(null), 1500);
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <Code size={18} />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight">API Docs</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Left Sidebar - Table of Contents */}
            <aside className={`
                fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
                p-8 overflow-y-auto custom-scrollbar no-scrollbar
            `}>
                <div className="space-y-8">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
                        />
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 pl-2">Documentation</h3>
                        <nav className="space-y-1">
                            {filteredSections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                                        activeSection === section.id 
                                        ? "bg-primary/5 text-primary" 
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <section.icon size={18} />
                                    {section.label}
                                    {activeSection === section.id && <ChevronRight size={14} className="ml-auto" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                            <Code size={20} />
                        </div>
                        <h4 className="text-sm font-black tracking-tight mb-2">API Reference</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-4">
                            Access full system capabilities via our RESTful endpoints.
                        </p>
                        <div className="text-[10px] font-mono text-primary bg-primary/10 px-3 py-2 rounded-lg inline-block">
                            {DOCS_VERSION}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-16 max-w-5xl mx-auto space-y-24">
                
                {/* Configuration Note */}
                <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-5 shadow-sm">
                    <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
                        <Globe size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-blue-900 tracking-tight mb-1">Environmental Configuration</h4>
                        <p className="text-xs text-blue-700/80 font-semibold leading-relaxed">
                            The following documentation assumes your backend is running on <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-bold">localhost:9090</code>. 
                            Ensure you swap this with your production API gateway URL for live environments.
                        </p>
                    </div>
                </div>
                
                {/* 1. Overview */}
                <section id="overview" className="scroll-mt-32 space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                        <BookOpen size={12} strokeWidth={3} /> Introduction
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                        Form Builder <span className="text-primary italic">Developer API</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl">
                        A sophisticated, dynamic system that separates form structure from data collection. 
                        Build, version, and deploy complex forms without changing frontend code.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-4">Dynamic Rendering</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                The frontend acts as a dynamic renderer, fetching metadata to determine field types, validation, and rules.
                            </p>
                        </div>
                        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <Send size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-4">Submission Logic</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Responses are stored dynamically based on versioned schemas, allowing for asynchronous form evolution.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* 2. Metadata API */}
                <section id="metadata" className="scroll-mt-32 space-y-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <FileText size={12} strokeWidth={3} /> Metadata API
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fetch Form Definitions</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Retrieve the complete form schema including field types, labels, and validation rules.
                        </p>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg">GET</span>
                                <code className="text-xs text-slate-400 font-mono">/api/v1/forms/&#123;formId&#125;</code>
                            </div>
                            <button 
                                onClick={() => handleCopy("GET http://localhost:9090/api/v1/forms/{formId}", "get-meta")}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                {copiedId === "get-meta" ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Path Parameters</h4>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5 text-slate-500">
                                            <th className="pb-4 font-black">Field</th>
                                            <th className="pb-4 font-black">Type</th>
                                            <th className="pb-4 font-black">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                        <tr>
                                            <td className="py-4 font-mono text-primary">formId</td>
                                            <td className="py-4">UUID</td>
                                            <td className="py-4 font-medium">The unique identifier of the form (e.g. 02ebe36d...)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Response Example (JSON)</h4>
                                <div className="relative group">
<pre className="p-8 bg-slate-950/50 rounded-3xl text-sm text-primary font-mono overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "data": {
    "id": "e2ebe36d-5248-...",
    "formName": "Employee Onboarding",
    "status": "PUBLISHED",
    "fields": [
      {
        "fieldName": "Full Name",
        "fieldKey": "full_name", "fieldType": "text",
        "required": true, "minLength": 3,
        "placeholder": "Enter legal name"
      },
      {
        "fieldName": "Date of Birth",
        "fieldKey": "dob", "fieldType": "date",
        "required": true, "beforeDate": "2006-01-01",
        "helperText": "Must be 18+"
      },
      {
        "fieldName": "Technical Skills",
        "fieldKey": "skills", "fieldType": "select",
        "options": ["React", "Java", "Spring"],
        "isMultiSelect": true
      },
      {
        "fieldName": "Resume / CV",
        "fieldKey": "resume_file", "fieldType": "file_upload",
        "maxFileSize": 5, "allowedFileTypes": ".pdf,.docx"
      }
    ]
  }
}`}
</pre>
                                    <button 
                                        onClick={() => handleCopy(`{ "success": true, "data": { ... } }`, "get-meta-json")}
                                        className="absolute right-6 top-6 p-2 bg-white/5 text-slate-500 rounded-xl hover:text-white transition-all backdrop-blur-sm"
                                    >
                                        {copiedId === "get-meta-json" ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                             Full Property Manifest
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { k: "fieldKey", d: "Target technical name." },
                                { k: "fieldName", d: "UI Label text." },
                                { k: "fieldType", d: "Component type." },
                                { k: "required", d: "Mandatory flag." },
                                { k: "pattern", d: "Regex validation." },
                                { k: "minLength/Max", d: "Length limits." },
                                { k: "min/Max", d: "Numeric range." },
                                { k: "before/AfterDate", d: "Date limits." },
                                { k: "before/AfterTime", d: "Time limits." },
                                { k: "options", d: "Selection array." },
                                { k: "defaultValue", d: "Initial state." },
                                { k: "placeholder", d: "Input hint." },
                                { k: "helperText", d: "Below-input text." },
                                { k: "sourceTable", d: "Dynamic source for dropdowns." },
                                { k: "maxFileSize", d: "Upload MB limit." },
                                { k: "allowedFiles", d: ".pdf,.jpg etc." },
                                { k: "isReadOnly", d: "Disable editing." },
                                { k: "isMultiSelect", d: "Multiple choice." }
                            ].map(item => (
                                <div key={item.k} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                    <code className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">{item.k}</code>
                                    <p className="text-[10px] text-slate-500 font-bold leading-tight">{item.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* 2.5 Supported Components */}
                <section id="components" className="scroll-mt-32 space-y-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <ListPlus size={12} strokeWidth={3} /> Component Library
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Supported Field Types</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            A comprehensive collection of 17+ input types and layout elements available for form construction.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {[
                            {
                                category: "Text & Inputs",
                                items: [
                                    { type: "text", icon: Type, desc: "Single-line input" },
                                    { type: "textarea", icon: Pilcrow, desc: "Multi-line area" },
                                    { type: "email", icon: Mail, desc: "Email validation" },
                                    { type: "url", icon: Link, desc: "Link/URL validation" }
                                ]
                            },
                            {
                                category: "Numbers & Contact",
                                items: [
                                    { type: "number", icon: Hash, desc: "Numeric values" },
                                    { type: "phone", icon: Phone, desc: "Phone validation" }
                                ]
                            },
                            {
                                category: "Selection & Choice",
                                items: [
                                    { type: "radio", icon: CircleDot, desc: "Single choice" },
                                    { type: "checkbox", icon: CheckSquare, desc: "Multiple choice" },
                                    { type: "select", icon: ListPlus, desc: "Dropdown list" },
                                    { type: "toggle", icon: ToggleLeft, desc: "Binary switch" }
                                ]
                            },
                            {
                                category: "Date & Time",
                                items: [
                                    { type: "date", icon: Calendar, desc: "Date picker" },
                                    { type: "time", icon: Clock, desc: "Time selector" }
                                ]
                            },
                            {
                                category: "Advanced & Layout",
                                items: [
                                    { type: "file_upload", icon: Layout, desc: "File attachments" },
                                    { type: "heading", icon: Heading, desc: "Header text" },
                                    { type: "paragraph", icon: Pilcrow, desc: "Description text" },
                                    { type: "divider", icon: Minus, desc: "Visual separator" },
                                    { type: "page_break", icon: SeparatorHorizontal, desc: "Pagination" }
                                ]
                            }
                        ].map(cat => (
                            <div key={cat.category} className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">{cat.category}</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {cat.items.map(item => (
                                        <div key={item.type} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-lg hover:shadow-primary/5 transition-all group">
                                            <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary rounded-xl flex items-center justify-center mb-4 transition-all">
                                                <item.icon size={20} />
                                            </div>
                                            <code className="text-[11px] font-black text-slate-900 group-hover:text-primary transition-colors">{item.type}</code>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1 leading-tight">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm mt-12">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Technical Type Manifest</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { t: "text", d: "Generic alphanumeric string" },
                                { t: "email", d: "Strict RFC 5322 validation" },
                                { t: "password", d: "Masked character input" },
                                { t: "number", d: "Floating point or integer" },
                                { t: "date", d: "ISO 8601 YYYY-MM-DD" },
                                { t: "time", d: "24-hour HH:mm format" },
                                { t: "select / radio", d: "Single value from options" },
                                { t: "checkbox", d: "JSON array of selected strings" },
                                { t: "file_upload", d: "Persistent cloud storage URL" }
                            ].map(type => (
                                <div key={type.t} className="flex flex-col gap-1">
                                    <code className="text-xs font-black text-primary">{type.t}</code>
                                    <span className="text-[10px] text-slate-500 font-bold">{type.d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* Rules Engine */}
                <section id="rules" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Zap size={12} strokeWidth={3} /> Logic Engine
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Rules Engine</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Implement sophisticated dynamic conditional logic to control field visibility and behavior in real-time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Logical Operators</h4>
                                <div className="space-y-4">
                                    {[
                                        { op: "EQUALS", desc: "Strict equality check" },
                                        { op: "NOT_EQUALS", desc: "Inequality check" },
                                        { op: "GREATER_THAN", desc: "Numeric comparison" },
                                        { op: "CONTAINS", desc: "Substring matching" }
                                    ].map(item => (
                                        <div key={item.op} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <code className="text-xs font-black text-primary">{item.op}</code>
                                            <span className="text-[10px] text-slate-500 font-bold">{item.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Action Types</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {["SHOW", "HIDE", "ENABLE", "DISABLE"].map(action => (
                                        <div key={action} className="p-4 bg-slate-900 rounded-2xl text-center">
                                            <code className="text-[10px] font-black text-emerald-400">{action}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden">
                            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rule Definition (JSON)</span>
                                <button 
                                    onClick={() => handleCopy(`{ "condition": { ... }, "action": { ... } }`, "rules-json")}
                                    className="text-slate-500 hover:text-white"
                                >
                                    {copiedId === "rules-json" ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="p-8">
<pre className="p-8 bg-slate-950/50 rounded-3xl text-sm text-primary font-mono overflow-x-auto leading-relaxed">
{`{
  "condition": {
    "logicalOperator": "AND",
    "conditions": [
      { 
        "field": "user_age", 
        "operator": "GREATER_THAN", 
        "value": "18" 
      }
    ]
  },
  "action": {
    "type": "SHOW",
    "targetField": "license_number"
  }
}`}
</pre>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* 3. Submission API */}
                <section id="submission" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Send size={12} strokeWidth={3} /> Submission API
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Post User Responses</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            A structured, type-safe way to persist dynamic field data into the form's versioned architecture.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Payload Manifest */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Payload Manifest</h4>
                            <div className="space-y-3">
                                {[
                                    { k: "formId", t: "UUID", r: "Yes", d: "Unique identifier for the form structure." },
                                    { k: "versionId", t: "UUID", r: "Yes", d: "The architectural version being submitted." },
                                    { k: "values", t: "Object", r: "Yes", d: "Map of fieldKey to actual user data." }
                                ].map(item => (
                                    <div key={item.k} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="text-xs font-black text-primary">{item.k}</code>
                                                <span className="text-[9px] font-bold text-slate-400 opacity-60">({item.t})</span>
                                                {item.r === "Yes" && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Required</span>}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Value Formatting Guide */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Formatting Reference</h4>
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Terminal size={120} />
                                </div>
                                <div className="space-y-6 relative z-10">
                                    {[
                                        { t: "text / email", v: "\"John Doe\"" },
                                        { t: "number", v: "42" },
                                        { t: "checkbox / list", v: "[\"A\", \"B\"]" },
                                        { t: "date / time", v: "\"2024-12-31\"" },
                                        { t: "toggle / radio", v: "\"true\"" }
                                    ].map(item => (
                                        <div key={item.t} className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.t}</span>
                                            <code className="text-xs font-mono text-emerald-400">{item.v}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Try API Section */}
                    <div className="bg-white border-2 border-primary/10 rounded-[2.5rem] p-1 shadow-xl shadow-primary/5 overflow-hidden">
                        <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1 space-y-6 text-center md:text-left">
                                <div className="w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto md:mx-0">
                                    <Terminal size={28} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Interactive Playground</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Test the submission endpoint directly with a mock payload to verify your structural mapping.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleTryApi("submission")}
                                    className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-black transition-all flex items-center justify-center gap-3 group"
                                >
                                    {isTryingApi === "submission" ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                                    {isTryingApi === "submission" ? "Simulating..." : "Test Submission API"}
                                </button>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="bg-slate-900 rounded-[2rem] p-6 relative overflow-hidden min-h-[180px] flex flex-col justify-center">
                                    {isTryingApi === "submission" ? (
                                        <div className="space-y-4 animate-pulse">
                                            <div className="h-4 w-3/4 bg-white/5 rounded-full" />
                                            <div className="h-4 w-1/2 bg-white/5 rounded-full" />
                                            <div className="h-4 w-2/3 bg-white/5 rounded-full" />
                                        </div>
                                    ) : (
                                        <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
                                            {isTryingApi === null && !copiedId?.includes("test") ? "// Click the button to simulate a response\n\nWaiting for payload..." : 
                                            `{
  "success": true,
  "message": "Submission successful",
  "data": {
    "submission_id": "8c5b...",
    "recorded_at": "${new Date().toISOString()}"
  }
}`}
                                        </pre>
                                    )}
                                </div>
                            </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm mt-12">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Data Type Mapping Reference</h4>
                    <div className="overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                                <tr>
                                    <th className="pb-4">Field Category</th>
                                    <th className="pb-4">JSON Type</th>
                                    <th className="pb-4">Example Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { c: "Standard Inputs", t: "String", e: "\"Jane Doe\"" },
                                    { c: "Numeric Fields", t: "Number", e: "25" },
                                    { c: "Binary Options", t: "Boolean / String", e: "true / \"true\"" },
                                    { c: "Multi-Selection", t: "Array<String>", e: "[\"A\", \"B\"]" },
                                    { c: "Cloud Media", t: "String (URL)", e: "\"https://.../doc.pdf\"" }
                                ].map(row => (
                                    <tr key={row.c}>
                                        <td className="py-4 text-[11px] font-black text-slate-900">{row.c}</td>
                                        <td className="py-4"><code className="text-[10px] font-bold text-primary">{row.t}</code></td>
                                        <td className="py-4 font-mono text-[10px] text-emerald-600 font-bold">{row.e}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                    {/* Example Full JSON */}
                    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden mt-12">
                        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comprehensive Example</span>
                            <code className="text-[10px] font-mono text-emerald-500/50">POST /api/v1/submissions</code>
                        </div>
                        <div className="p-8">
<pre className="p-8 bg-slate-950/50 rounded-3xl text-sm text-primary font-mono overflow-x-auto leading-relaxed">
{`{
  "formId": "02ebe36d-5248-4c89-9d99-f36f17df22f0",
  "versionId": "f47ac10b-58cc-...",
  "values": {
    "full_name": "John Doe",
    "experience_years": 8,
    "tech_stack": ["React", "Spring Boot", "Next.js"],
    "start_date": "2024-08-01",
    "is_remote": "true"
  }
}`}
</pre>
                        </div>
                    </div>

                    <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4 mt-8">
                        <AlertCircle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h4 className="text-sm font-black text-amber-900 tracking-tight">Critical Mapping Rule</h4>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1">
                                Every key in the <code className="bg-amber-100 px-1 rounded">values</code> object <strong>MUST</strong> exactly match a <code className="bg-amber-100 px-1 rounded">fieldKey</code> from the metadata response. 
                                Unmapped keys will be ignored, and missing required keys will trigger a structural validation error.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Error Handling */}
                <section id="errors" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <AlertCircle size={12} strokeWidth={3} /> Quality Control
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Error Handling</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Comprehensive guide to status codes and error object structures for bulletproof integrations.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Error Response</h4>
                            <div className="bg-slate-900 rounded-[2.5rem] p-10">
<pre className="text-xs text-primary font-mono leading-relaxed">
{`{
  "success": false,
  "message": "field_name is required",
  "data": null,
  "status": 400,
  "timestamp": "${new Date().toUTCString()}"
}`}
</pre>
                            </div>
                        </div>

                        <div className="overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-sm self-start">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-5">Code</th>
                                        <th className="px-6 py-5">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px] font-medium text-slate-500">
                                    {[
                                        { c: "VALIDATION_ERROR", d: "One or more inputs failed constraints." },
                                        { c: "MISSING_FIELD", d: "A required technical key is absent." },
                                        { c: "UNAUTHORIZED", d: "Bearer token is invalid or expired." },
                                        { c: "SERVER_ERROR", d: "Unexpected processing failure." }
                                    ].map(row => (
                                        <tr key={row.c}>
                                            <td className="px-6 py-4 font-black">{row.c}</td>
                                            <td className="px-6 py-4">{row.d}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* File Upload Flow */}
                <section id="upload" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Layout size={12} strokeWidth={3} /> Advanced Media
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">File Upload Flow</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { s: "Step 1", t: "Select & Validate", d: "User picks file. Frontend checks `maxFileSize` and `allowedFileTypes` property." },
                            { s: "Step 2", t: "Cloud Upload", d: "Direct upload to storage or via pre-signed URL to obtain the persistent URL." },
                            { s: "Step 3", t: "Record Reference", d: "Include the file URL in the `values` object using the field technical key." }
                        ].map(step => (
                            <div key={step.s} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative overflow-hidden translate-y-0 hover:-translate-y-2 transition-transform">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 block">{step.s}</span>
                                <h4 className="text-sm font-black text-slate-900 mb-2">{step.t}</h4>
                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{step.d}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <div className="p-10 flex flex-col md:flex-row gap-10">
                            <div className="flex-1 space-y-6">
<pre className="text-sm text-primary font-mono leading-relaxed">
{`{
  "values": {
    "full_name": "Jane User",
    "resume_file": "https://cdn.host.com/f/394.pdf"
  }
}`}
</pre>
                            </div>
                            <div className="flex-1 text-slate-400 text-xs font-medium space-y-4 pt-4">
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <h5 className="text-white font-black mb-2 uppercase tracking-widest text-[10px]">Upload Parameters</h5>
                                    <ul className="space-y-2">
                                         <li className="flex justify-between"><span>maxFileSize</span> <span className="text-white">5 MB</span></li>
                                        <li className="flex justify-between"><span>allowedFiles</span> <span className="text-white">.pdf, .jpg, .png, .xlsx, .xml</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Supported Media Formats</h4>
                            <div className="space-y-6">
                                {[
                                    { g: "Documents", e: "pdf" },
                                    { g: "Images", e: "jpg, png" },
                                    { g: "Spreadsheets", e: "xlsx" },
                                    { g: "Data Structure", e: "xml" }
                                ].map(group => (
                                    <div key={group.g} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                        <span className="text-[11px] font-black text-slate-900">{group.g}</span>
                                        <div className="flex flex-wrap gap-1 items-center justify-end">
                                            {group.e.split(", ").map(ext => (
                                                <code key={ext} className="text-[9px] font-black bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">.{ext}</code>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">System Upload Limits</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-[11px] font-black">Global Default</span>
                                        <span className="text-xl font-black text-primary">5 MB</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        System-wide limits are enforced at the API Gateway level. Individual fields can further restrict this via the <code className="text-white">maxFileSize</code> property in the metadata.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20">
                                <h5 className="flex items-center gap-2 text-xs font-black text-primary mb-2 italic">
                                    <Zap size={14} /> Performance Note
                                </h5>
                                <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                                    For files larger than 10MB, we recommend implementing chunked uploads or direct-to-S3 pre-signed URLs to bypass server timeouts.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>



                {/* 4. Complete Flow */}
                <section id="flow" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Zap size={12} strokeWidth={3} /> Architecture
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">The Integration Lifecycle</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            How the dynamic engine coordinates between your project and our API architecture.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { s: "01", t: "Fetch Metadata", d: "Call GET /api/v1/forms/{id} to receive the architectural blueprint." },
                            { s: "02", t: "Render UI", d: "Iterate through the `fields` array to dynamically build the form components." },
                            { s: "03", t: "Collect Data", d: "Map user inputs to specific `fieldKey` identifiers from the metadata." },
                            { s: "04", t: "Submit Payload", d: "POST the `values` object back to /api/v1/submissions for storage." }
                        ].map(step => (
                            <div key={step.s} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
                                <span className="absolute -right-4 -top-4 text-7xl font-black text-slate-50 group-hover:text-primary/5 transition-colors">{step.s}</span>
                                <h4 className="text-sm font-black text-slate-900 mb-2 relative z-10">{step.t}</h4>
                                <p className="text-[11px] text-slate-500 font-bold leading-relaxed relative z-10">{step.d}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* 5. Key Concepts */}
                <section id="concepts" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Terminal size={12} strokeWidth={3} /> Logic Engine
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Core Technical Concepts</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Concept: fieldKey */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 font-mono">
                                <Code size={20} className="text-primary" /> 
                                fieldKey Generation
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                The <code className="text-primary font-bold">fieldKey</code> is automatically derived from the label using a deterministic <strong>Slugification Algorithm</strong>. Developers <strong>MUST</strong> use these keys in the submission payload.
                            </p>
                            
                            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slugification Rules</h4>
                                <ul className="space-y-3">
                                    {[
                                        { l: "Lowercase", d: "Converts all characters to lower" },
                                        { l: "Snake Case", d: "Spaces become underscores (_)" },
                                        { l: "Sanitize", d: "Removes symbols like (*), @, #" }
                                    ].map(rule => (
                                        <li key={rule.l} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                            <span className="opacity-60">{rule.l}:</span>
                                            <span>{rule.d}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Concept: Table */}
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Live Conversion Examples</h4>
                            <div className="space-y-4">
                                {[
                                    { f: "First Name", t: "first_name" },
                                    { f: "Phone Number (*)", t: "phone_number" },
                                    { f: "Select Department", t: "select_department" },
                                    { f: "Total_Score", t: "total_score" }
                                ].map(row => (
                                    <div key={row.f} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">{row.f}</span>
                                        <ChevronRight size={12} className="text-slate-300" />
                                        <code className="text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded-lg">{row.t}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* 6. Validations */}
                <section id="validation" className="scroll-mt-32 space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <AlertCircle size={12} strokeWidth={3} /> Constraints
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Validation Reference</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            A mapping of architectural properties to frontend validation logic.
                        </p>
                    </div>

                    <div className="overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-6">Property</th>
                                    <th className="px-8 py-6">Applies To</th>
                                    <th className="px-8 py-6">Constraint Logic</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { p: "required", a: "All Inputs", l: "Must contain a non-null, non-empty value." },
                                    { p: "pattern", a: "Text, Email, URL", l: "RegExp comparison for complex formats." },
                                    { p: "minLength / Max", a: "Text, TextArea", l: "Character count enforcement." },
                                    { p: "min / Max", a: "Numbers", l: "Numeric range bounds (inclusive)." },
                                    { p: "before / AfterDate", a: "Date", l: "Chronological limits on selection." },
                                    { p: "maxFileSize", a: "File Upload", l: "Megabyte (MB) limit on disk size." }
                                ].map(row => (
                                    <tr key={row.p} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-mono text-xs text-primary font-bold">{row.p}</td>
                                        <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{row.a}</td>
                                        <td className="px-8 py-5 text-[11px] font-medium text-slate-400">{row.l}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="h-px bg-slate-200" />

                {/* 7. Security */}
                <section id="security" className="scroll-mt-32 space-y-10 pb-32">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <ShieldCheck size={12} strokeWidth={3} /> Security Protocols
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Data Integrity & Access</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                            <h4 className="font-black text-slate-900 flex items-center gap-2">
                                <Lock className="text-primary" size={18} /> Authentication
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                All protected endpoints require a Bearer Token in the authorization header.
                            </p>
                            <code className="block p-3 bg-slate-50 rounded-xl text-[10px] font-mono text-primary">
                                Authorization: Bearer &lt;jwt_token&gt;
                            </code>
                        </div>
                        <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                            <h4 className="font-black text-slate-900 flex items-center gap-2">
                                <Activity className="text-primary" size={18} /> Rate Limiting
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                To ensure system stability, we enforce a strict request threshold per IP/User.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                                <span className="px-2 py-1 bg-slate-100 rounded">100 req / minute</span>
                                <span className="px-2 py-1 bg-slate-100 rounded">Standard Tier</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 bg-slate-900 rounded-[3rem] text-center text-white space-y-6">
                        <h3 className="text-2xl font-black tracking-tight">Ready to integrate?</h3>
                        <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                            Check our best practices section to optimize your implementation for scale.
                        </p>
                        <button 
                            onClick={() => window.open('https://github.com/formbuilder/sdk', '_blank')}
                            className="px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Download SDK
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}
