import { 
  Type, Hash, Mail, Calendar, Phone, Clock, Link, CircleDot, CheckSquare,
  ListPlus, ToggleLeft, ChevronRight, Heading, Pilcrow, Minus, Layout
} from "lucide-react";

export const FieldIcons = {
  text: <Type size={18} />, 
  textarea: <Pilcrow size={18} />, 
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
  page_break: <Layout size={18} />,
  heading: <Heading size={18} />,
  paragraph: <Pilcrow size={18} />,
  divider: <Minus size={18} />,
};

export const StaticElementTypes = [
  { type: "heading", label: "Heading Element", desc: "Define structural landmarks", color: "amber", icon: <Heading size={16} /> },
  { type: "paragraph", label: "Text Narrative", desc: "Contextual descriptions", color: "sky", icon: <Pilcrow size={16} /> },
  { type: "divider", label: "Phase Breaker", desc: "Discrete visual separation", color: "slate", icon: <Minus size={16} /> },
  { type: "page_break", label: "Pagination", desc: "Multi-phase orchestration", color: "indigo", icon: <Layout size={16} /> },
];

export const RegularFieldTypes = ["text", "textarea", "number", "email", "date", "phone", "time", "url", "radio", "checkbox", "select", "toggle"];
