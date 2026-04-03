import { ArrowLeft, Trash2, CheckCircle2, Save, Send, Rocket, ShieldCheck, Eye, GitBranch } from "lucide-react";
import NextLink from "next/link";

const generateFormCode = (displayName) => {
  if (!displayName) return "";
  let code = displayName.trim().toLowerCase();
  code = code.replace(/[\s\-]+/g, "_");
  code = code.replace(/[^a-z0-9_]/g, "");
  code = code.replace(/_+/g, "_");
  code = code.replace(/^_+|_+$/g, "");
  if (!code) return "";
  if (/^\d/.test(code)) code = "f_" + code;
  return code.substring(0, 50);
};

export { generateFormCode };

export function FormHeader({
  formName,
  setFormName,
  formStatus = "DRAFT",
  deleteForm,
  saveForm,
  publishForm,
  isSaving,
  isPublishing,
  showSuccess,
  saveLabel = "Save Changes",
  saveIcon = <Save size={16} />,
  userRole,
  formId,
  onPreview
}) {
  const isPublished = formStatus === "PUBLISHED";

  return (
    <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between z-10 bg-white/50 backdrop-blur-xl gap-6 sticky top-0">
      <div className="flex items-center gap-4 flex-1">
        <NextLink href="/forms/all" className="group flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all outline-none">
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </NextLink>
        <div className="flex flex-col flex-1 max-w-lg">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 ml-1 truncate">
            {isPublished ? "Immutable Protocol" : "Architectural Draft"}
          </span>
          <input
            type="text"
            placeholder="Name your masterpiece..."
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className={`text-xl font-black bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-slate-300 tracking-tight text-slate-900`}
          />

          {formName && formName.trim().length > 0 && formName.trim().length < 3 && (
            <span className="text-[10px] font-bold text-amber-500 mt-1">
              Minimum 3 characters
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isPublished ? (
          <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/5 transition-all">
            <ShieldCheck size={16} strokeWidth={3} className="animate-in zoom-in duration-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
              Operational State: Live
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {formStatus}
            </span>
          </div>
        )}

        <div className="w-px h-8 bg-slate-100 mx-1" />

        {deleteForm && (
          <button
            onClick={deleteForm}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm group"
            title="Discard Changes"
          >
            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        )}

        {!isPublished && publishForm && (
          <button
            onClick={publishForm}
            disabled={isSaving || isPublishing}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] bg-white border-2 border-primary text-primary hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPublishing ? (
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            ) : (
              <><Rocket size={18} strokeWidth={3} /> Publish Architecture</>
            )}
          </button>
        )}



        <button
          onClick={onPreview}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all shadow-sm group"
          title="Preview Form"
        >
          <Eye size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={saveForm}
          disabled={isSaving || showSuccess || isPublishing}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl ${showSuccess
              ? "bg-green-500 text-white shadow-green-500/20"
              : "bg-slate-900 text-white hover:bg-primary shadow-slate-900/20 hover:shadow-primary/20"
            } disabled:opacity-50`}
        >
          {showSuccess ? (
            <><CheckCircle2 size={18} strokeWidth={3} /> {formStatus === "DRAFT" ? "Form saved as draft" : "New version created"}</> // FIXED: Status-dependent success message
          ) : isSaving ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>{saveIcon} {saveLabel}</>
          )}
        </button>
      </div>
    </header>
  );
}
