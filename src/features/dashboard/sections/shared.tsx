import { useState, type RefObject } from 'react';
import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';
import { downloadElementAsImage } from '@/lib/exportImage';

export function DetailButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();

  return (
    <button type="button" className={`${UI_BUTTON_GHOST_SM} w-full sm:w-36`} onClick={onClick}>
      {t('detailOpen')}
    </button>
  );
}

async function waitForExportTarget(targetRef: RefObject<HTMLElement | null>, timeoutMs = 2_000) {
  if (targetRef.current) {
    return targetRef.current;
  }

  return new Promise<HTMLElement | null>((resolve) => {
    const startedAt = performance.now();

    const tick = () => {
      if (targetRef.current) {
        resolve(targetRef.current);
        return;
      }

      if (performance.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
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
      className={`${UI_BUTTON_GHOST_SM} w-full sm:w-44`}
      disabled={isExporting}
      onClick={async () => {
        try {
          setIsExporting(true);
          const targetElement = await waitForExportTarget(targetRef);
          if (!targetElement) {
            return;
          }
          await downloadElementAsImage(targetElement, fileName);
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
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
      <ExportImageButton targetRef={exportTargetRef} fileName={exportFileName} />
      {onOpenDetail ? <DetailButton onClick={onOpenDetail} /> : null}
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
    <div className="min-h-5 text-[11px] text-slate-500 sm:text-xs">
      {t('axisXRange')}: {xStart}% - {xEnd}% | {t('axisYRange')}: {yMin || t('axisAuto')} -{' '}
      {yMax || t('axisAuto')}
    </div>
  );
}
