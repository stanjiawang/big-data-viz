import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';

export function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={UI_BUTTON_GHOST_SM} onClick={onClick}>
      Open detail
    </button>
  );
}

export function RangeSummary({
  xStart,
  xEnd,
  yMin,
  yMax,
}: {
  xStart: number;
  xEnd: number;
  yMin: string;
  yMax: string;
}) {
  return (
    <div className="text-[11px] text-slate-500 sm:text-xs">
      X: {xStart}% - {xEnd}% | Y: {yMin || 'auto'} - {yMax || 'auto'}
    </div>
  );
}
