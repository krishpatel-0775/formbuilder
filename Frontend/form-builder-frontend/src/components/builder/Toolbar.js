import { FieldIcons, StaticElementTypes, RegularFieldTypes } from "./FieldConstants";

export function Toolbar({ handleDragStart }) {
  return (
    <aside className="w-[320px] bg-white border-r border-slate-200 overflow-y-auto z-20 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
      <div className="p-8 border-b border-slate-50">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Components</h2>
        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Build your form</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Static Elements Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout & Content</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {StaticElementTypes.map((item) => (
              <div key={item.type} draggable onDragStart={(e) => handleDragStart(e, item.type)}
                className={`flex items-center gap-4 p-4 rounded-2xl bg-white border border-${item.color}-100 shadow-sm cursor-grab hover:bg-${item.color}-50 hover:border-${item.color}-200 hover:shadow-md transition-all group hover:-translate-y-0.5`}>
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-${item.color}-50 text-${item.color}-500 border border-${item.color}-100 shadow-inner group-hover:bg-white transition-all duration-300`}>
                  {item.icon}
                </div>
                <div>
                  <span className={`text-sm font-bold text-${item.color}-900`}>{item.label}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Fields Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Fields</span>
          </div>
          {RegularFieldTypes.map((type) => (
            <div key={type} draggable onDragStart={(e) => handleDragStart(e, type)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-grab hover:bg-slate-50 hover:border-violet-200 hover:shadow-md transition-all group hover:-translate-y-0.5">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-100 text-slate-400 transition-all duration-300">
                {FieldIcons[type]}
              </div>
              <div>
                <span className="text-sm font-bold capitalize text-slate-700 group-hover:text-slate-900 transition-colors">{type}</span>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Custom input field</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </aside>
  );
}
