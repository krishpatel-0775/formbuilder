import { 
  Type, Hash, Mail, Calendar, Trash2, GripVertical, X, AlertCircle, ShieldCheck,
  CheckCircle2, ListPlus, ArrowRight, AlignLeft, CircleDot, CheckSquare,
  Save, ArrowLeft, Loader2, Phone, Clock, Link, SlidersHorizontal, GitBranch, AlertTriangle, ChevronRight,
  Heading, Pilcrow, Minus, ToggleLeft
} from "lucide-react";

export const FieldIcons = {
  text: <Type size={18} />, 
  textarea: <AlignLeft size={18} />, 
  number: <Hash size={18} />,
  email: <Mail size={18} />, 
  date: <Calendar size={18} />, 
  phone: <Phone size={18} />,
  time: <Clock size={18} />, 
  url: <Link size={18} />, 
  radio: <CircleDot size={18} />,
  checkbox: <CheckSquare size={18} />, 
  select: <ListPlus size={18} />,
  toggle: <ToggleLeft size={18} />,
  page_break: <ChevronRight size={18} />,
  heading: <Heading size={18} />,
  paragraph: <Pilcrow size={18} />,
  divider: <Minus size={18} />,
};

export const StaticElementTypes = [
  { type: "heading", label: "Heading", desc: "Section title", color: "amber", icon: <Heading size={16} /> },
  { type: "paragraph", label: "Paragraph", desc: "Description text", color: "sky", icon: <Pilcrow size={16} /> },
  { type: "divider", label: "Divider", desc: "Visual separator", color: "slate", icon: <Minus size={16} /> },
  { type: "page_break", label: "Page Break", desc: "Split form into pages", color: "indigo", icon: <ChevronRight size={16} /> },
];

export const RegularFieldTypes = ["text", "textarea", "number", "email", "date", "phone", "time", "url", "radio", "checkbox", "select", "toggle"];
