import { 
  Type, Hash, Mail, Calendar, Phone, Clock, Link, CircleDot, CheckSquare,
  ListPlus, ToggleLeft, ChevronRight, Heading, Pilcrow, Minus, Layout, Box
} from "lucide-react";

export const FieldIcons = {
  text: <Type size={18} />, 
  textarea: <Pilcrow size={18} />, 
  number: <Hash size={18} />,
  decimal: <Hash size={18} />,
  email: <Mail size={18} />, 
  date: <Calendar size={18} />, 
  phone: <Phone size={18} />,
  time: <Clock size={18} />, 
  datetime: <Calendar size={18} />,
  url: <Link size={18} />, 
  radio: <CircleDot size={18} />,
  checkbox: <CheckSquare size={18} />, 
  select: <ListPlus size={18} />,
  toggle: <ToggleLeft size={18} />,
  file_upload: <Layout size={18} />,
  page_break: <Layout size={18} />,
  heading: <Heading size={18} />,
  paragraph: <Pilcrow size={18} />,
  divider: <Minus size={18} />,
  group: <Box size={18} />,
};

export const StaticElementTypes = [
  { type: "heading", label: "Heading Element", desc: "For heading", color: "amber", icon: <Heading size={16} /> },
  { type: "paragraph", label: "Text Narrative", desc: "Contextual descriptions", color: "sky", icon: <Pilcrow size={16} /> },
  { type: "divider", label: "Phase Breaker", desc: "Discrete visual separation", color: "slate", icon: <Minus size={16} /> },
  { type: "page_break", label: "Pagination", desc: "For next page", color: "indigo", icon: <Layout size={16} /> },
];

export const RegularFieldTypes = ["text", "textarea", "number", "decimal", "email", "date", "phone", "time", "datetime", "url", "radio", "checkbox", "select", "toggle", "file_upload", "group"];

export const FieldCategories = [
  {
    name: "Text & Inputs",
    fields: ["text", "textarea", "email", "url"]
  },
  {
    name: "Numbers & Contact",
    fields: ["number", "decimal", "phone"]
  },
  {
    name: "Selection & Choice",
    fields: ["radio", "checkbox", "select", "toggle"]
  },
  {
    name: "Date & Time",
    fields: ["date", "time", "datetime"]
  },
  {
    name: "Advanced",
    fields: ["file_upload"]
  },
  {
    name: "Layout & Containers",
    fields: ["group"]
  }
];
