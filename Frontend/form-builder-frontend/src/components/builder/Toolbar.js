import { FieldIcons, StaticElementTypes, RegularFieldTypes, FieldCategories } from "./FieldConstants";

export function Toolbar({ handleDragStart }) {
  return (
    <aside className="w-[260px] lg:w-[280px] xl:w-[340px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-full overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.01)] transition-all duration-500">
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20">
        <div className="p-8 border-b border-slate-50 flex-shrink-0 mb-6">
          <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Components</h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3.5">Build your architecture</p>
        </div>

        <div className="px-6 space-y-10">
          {/* Static Elements Area */}
        <div className="space-y-4">
          <div className="px-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Layout & Content</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {StaticElementTypes.map((item) => (
              <div key={item.type} draggable onDragStart={(e) => handleDragStart(e, item.type)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm cursor-grab hover:border-${item.color}-200 hover:shadow-lg hover:shadow-${item.color}-500/5 transition-all group hover:-translate-y-0.5 active:scale-95 text-center`}>
                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl bg-${item.color}-50 text-${item.color}-500 border border-${item.color}-100 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  {item.icon}
                </div>
                <span className={`text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors tracking-wide`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Fields Area */}
        <div className="space-y-8">
          <div className="px-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Question Fields</span>
          </div>
          
          {FieldCategories.map((category) => (
            <div key={category.name} className="space-y-3">
              <div className="px-2 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{category.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {category.fields.map((type) => (
                  <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm cursor-grab hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group hover:-translate-y-0.5 active:scale-95 text-center">
                    <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10 text-slate-400 transition-all duration-500 group-hover:scale-110">
                      {FieldIcons[type]}
                    </div>
                    <span className="text-[11px] font-bold capitalize text-slate-600 group-hover:text-slate-900 transition-colors tracking-wide">{type.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </aside>
  );
}
