export default function MetricCard({
  label,
  value,
  subValue,
  subValueColor = 'text-slate-500',
  icon: Icon,
  iconClass = 'text-blue-400',
}) {
  return (
    <div className="group rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>

        <div
          className={`
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-xl border border-slate-800
            bg-slate-900/80
            ${iconClass}
            transition-all duration-300
            group-hover:border-slate-700
          `}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div>
        <p className="text-xl font-extrabold tracking-tight text-slate-100 md:text-2xl">
          {value}
        </p>

        <p className={`mt-1.5 text-[11px] font-medium leading-tight ${subValueColor}`}>
          {subValue}
        </p>
      </div>
    </div>
  );
}