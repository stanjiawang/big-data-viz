import { useState, type RefObject } from 'react';
import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { downloadElementAsImage } from '@/lib/exportImage';

export function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={UI_BUTTON_GHOST_SM} onClick={onClick}>
      Open detail
    </button>
  );
}

function ExportImageButton({
  targetRef,
  fileName,
}: {
  targetRef: RefObject<HTMLElement | null>;
  fileName: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  return (
    <button
      type="button"
      className={UI_BUTTON_GHOST_SM}
      disabled={isExporting}
      onClick={async () => {
        if (!targetRef.current) return;
        try {
          setIsExporting(true);
          await downloadElementAsImage(targetRef.current, fileName);
        } finally {
          setIsExporting(false);
        }
      }}
    >
      {isExporting ? 'Exporting...' : 'Download image'}
    </button>
  );
}

export function SectionCardActions({
  onOpenDetail,
  exportTargetRef,
  exportFileName,
}: {
  onOpenDetail?: () => void;
  exportTargetRef: RefObject<HTMLElement | null>;
  exportFileName: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {onOpenDetail ? <DetailButton onClick={onOpenDetail} /> : null}
      <ExportImageButton targetRef={exportTargetRef} fileName={exportFileName} />
    </div>
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
