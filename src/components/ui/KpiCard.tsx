import { UI_LABEL_CLASS, UI_TEXT_MUTED_SM } from '@/components/ui/styleTokens';

type KpiCardProps = {
  label: string;
  value: string;
  trend?: string;
  helper?: string;
};

export function KpiCard({ label, value, trend, helper }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className={UI_LABEL_CLASS}>{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        {trend ? <span className="text-xs font-medium text-emerald-600">{trend}</span> : null}
      </div>
      {helper ? <p className={`${UI_TEXT_MUTED_SM} mt-2 text-xs`}>{helper}</p> : null}
    </div>
  );
}
