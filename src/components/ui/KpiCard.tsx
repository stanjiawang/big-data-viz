import { UI_LABEL_CLASS, UI_TEXT_MUTED_SM } from '@/components/ui/styleTokens';

type KpiCardProps = {
  label: string;
  value: string;
  trend?: string;
  helper?: string;
};

export function KpiCard({ label, value, trend, helper }: KpiCardProps) {
  return (
    <div className="liquid-panel min-h-36 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_6px_20px_rgb(15_23_42/6%)] backdrop-blur-[1px] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgb(15_23_42/10%)]">
      <p className={UI_LABEL_CLASS}>{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-[2rem] font-semibold leading-none tracking-[-0.02em] text-slate-900">
          {value}
        </span>
        {trend ? <span className="text-xs font-semibold text-emerald-700">{trend}</span> : null}
      </div>
      {helper ? <p className={`${UI_TEXT_MUTED_SM} mt-2 text-xs`}>{helper}</p> : null}
    </div>
  );
}
