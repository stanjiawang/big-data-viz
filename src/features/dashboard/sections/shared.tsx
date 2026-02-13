import { useState, type RefObject } from 'react';
import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import { downloadElementAsImage } from '@/lib/exportImage';

export function DetailButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();

  return (
    <button type="button" className={UI_BUTTON_GHOST_SM} onClick={onClick}>
      {t('detailOpen')}
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
  const { t } = useI18n();

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
      {isExporting ? t('detailExporting') : t('detailDownloadImage')}
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
  const { t } = useI18n();

  return (
    <div className="text-[11px] text-slate-500 sm:text-xs">
      {t('axisXRange')}: {xStart}% - {xEnd}% | {t('axisYRange')}: {yMin || t('axisAuto')} -{' '}
      {yMax || t('axisAuto')}
    </div>
  );
}
