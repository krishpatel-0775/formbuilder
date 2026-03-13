import { FieldIcons, StaticElementTypes, RegularFieldTypes } from "./FieldConstants";

export function Toolbar({ handleDragStart }) {
  return (
    <aside className="w-[340px] bg-white border-r border-slate-100 flex flex-col h-full overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.01)]">
      <div className="p-8 border-b border-slate-50 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Components</h2>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3.5">Build your form</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 pb-20">
        {/* Static Elements Area */}
        <div className="space-y-4">
          <div className="px-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Layout & Content</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {StaticElementTypes.map((item) => (
              <div key={item.type} draggable onDragStart={(e) => handleDragStart(e, item.type)}
                className={`flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm cursor-grab hover:border-${item.color}-200 hover:shadow-xl hover:shadow-${item.color}-500/5 transition-all group hover:-translate-y-0.5 active:scale-95`}>
                <div className={`w-11 h-11 flex items-center justify-center rounded-2xl bg-${item.color}-50 text-${item.color}-500 border border-${item.color}-100 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  {item.icon}
                </div>
                <div>
                  <span className={`text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors`}>{item.label}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest opacity-80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Fields Area */}
        <div className="space-y-4">
          <div className="px-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Question Fields</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {RegularFieldTypes.map((type) => (
              <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
                className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm cursor-grab hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group hover:-translate-y-0.5 active:scale-95">
                <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10 text-slate-400 transition-all duration-500 group-hover:scale-110">
                  {FieldIcons[type]}
                </div>
                <div>
                  <span className="text-sm font-bold capitalize text-slate-700 group-hover:text-slate-900 transition-colors">{type}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest opacity-80">Capture {type} data</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
