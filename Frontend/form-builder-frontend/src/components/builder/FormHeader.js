import { ArrowLeft, Trash2, CheckCircle2, Save } from "lucide-react";
import NextLink from "next/link";

export function FormHeader({ 
  formName, 
  setFormName, 
  formStatus = "DRAFT", 
  deleteForm, 
  saveForm, 
  isSaving, 
  showSuccess,
  saveLabel = "Save Changes",
  saveIcon = <Save size={16} />
}) {
  return (
    <header className="h-20 border-b border-slate-200 px-8 flex items-center justify-between z-10 backdrop-blur-xl bg-white/80 gap-4">
      <div className="flex items-center gap-4 flex-1">
        <NextLink href="/forms/all" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
        </NextLink>
        <input type="text" placeholder="Form Title..." value={formName} onChange={(e) => setFormName(e.target.value)}
          className="text-2xl font-black bg-transparent border-none outline-none focus:ring-0 flex-1 max-w-lg placeholder:text-slate-400 text-slate-900 tracking-tight" />
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${formStatus === "PUBLISHED" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
          {formStatus}
        </span>
        <button onClick={saveForm} disabled={isSaving || showSuccess}
          className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md ${showSuccess ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-900 text-white hover:bg-violet-600 hover:shadow-xl hover:shadow-violet-600/20"}`}>
          {showSuccess ? (<><CheckCircle2 size={16} /> Saved!</>) : isSaving
            ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            : (<>{saveIcon} {saveLabel}</>)}
        </button>
      </div>
    </header>
  );
}
