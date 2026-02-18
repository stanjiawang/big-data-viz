import { useMemo, useState } from 'react';
import {
  UI_BUTTON_GHOST_SM,
  UI_INPUT_MD,
  UI_LABEL_CLASS,
  UI_SELECT_MD,
  UI_TEXT_MUTED_SM,
} from '@/components/ui/styleTokens';
import type { DashboardAnnotationContext } from '@/features/dashboard/sections/types';
import type { DashboardAnnotation } from '@/features/dashboard/state/useDashboardState';
import { useI18n } from '@/i18n/useI18n';

const ANNOTATION_CONTEXTS: DashboardAnnotationContext[] = [
  'summary',
  'timeSeries',
  'embedding',
  'graph',
  'd3',
  'tablePrimary',
  'tableCompare',
];

function contextLabelKey(context: DashboardAnnotationContext) {
  if (context === 'summary') return 'annotationContextSummary' as const;
  if (context === 'timeSeries') return 'annotationContextTimeSeries' as const;
  if (context === 'embedding') return 'annotationContextEmbedding' as const;
  if (context === 'graph') return 'annotationContextGraph' as const;
  if (context === 'd3') return 'annotationContextD3' as const;
  if (context === 'tablePrimary') return 'annotationContextTablePrimary' as const;
  return 'annotationContextTableCompare' as const;
}

type AnnotationPanelProps = {
  annotations: DashboardAnnotation[];
  activeContext: DashboardAnnotationContext;
  onContextChange: (_context: DashboardAnnotationContext) => void;
  onCreateAnnotation: (_context: DashboardAnnotationContext, _message: string) => string | null;
  onDeleteAnnotation: (_annotationId: string) => boolean;
  onClearContext: (_context: DashboardAnnotationContext) => boolean;
};

export function AnnotationPanel({
  annotations,
  activeContext,
  onContextChange,
  onCreateAnnotation,
  onDeleteAnnotation,
  onClearContext,
}: AnnotationPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'empty'>('idle');

  const scopedAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.context === activeContext),
    [annotations, activeContext],
  );

  const handleSubmit = () => {
    const nextId = onCreateAnnotation(activeContext, draft);
    if (!nextId) {
      setStatus('empty');
      return;
    }
    setDraft('');
    setStatus('saved');
  };

  return (
    <section aria-labelledby="annotations-heading" className="space-y-3">
      <header>
        <h3 id="annotations-heading" className={UI_LABEL_CLASS}>
          {t('annotationTitle')}
        </h3>
        <p className={UI_TEXT_MUTED_SM}>{t('annotationDescription')}</p>
      </header>

      <div className="grid gap-2 xl:grid-cols-[minmax(220px,280px)_1fr_auto] xl:items-end">
        <label className="flex flex-col gap-1">
          <span className={UI_LABEL_CLASS}>{t('annotationContext')}</span>
          <span className="relative block">
            <select
              aria-label={t('annotationContext')}
              value={activeContext}
              className={`${UI_SELECT_MD} h-9 w-full px-2 pr-7 text-xs`}
              onChange={(event) =>
                onContextChange(event.target.value as DashboardAnnotationContext)
              }
            >
              {ANNOTATION_CONTEXTS.map((context) => (
                <option key={context} value={context}>
                  {t(contextLabelKey(context))}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            >
              <path
                d="M5.25 7.75 10 12.25l4.75-4.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
              />
            </svg>
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className={UI_LABEL_CLASS}>{t('annotationMessage')}</span>
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (status !== 'idle') {
                setStatus('idle');
              }
            }}
            placeholder={t('annotationMessagePlaceholder')}
            className={`${UI_INPUT_MD} h-9 px-2 text-xs`}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button type="button" className={`${UI_BUTTON_GHOST_SM} h-9 px-2`} onClick={handleSubmit}>
            {t('annotationAdd')}
          </button>
          <button
            type="button"
            className={`${UI_BUTTON_GHOST_SM} h-9 px-2`}
            disabled={scopedAnnotations.length === 0}
            onClick={() => {
              onClearContext(activeContext);
            }}
          >
            {t('annotationClearContext')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-slate-50/65 p-3">
        <p aria-live="polite" className="min-h-5 text-xs text-slate-500">
          {status === 'saved'
            ? t('annotationSaved')
            : status === 'empty'
              ? t('annotationEmptyError')
              : ''}
        </p>
        {scopedAnnotations.length === 0 ? (
          <p className="text-sm text-slate-500">{t('annotationNoItems')}</p>
        ) : (
          <ul className="space-y-2" aria-label={t('annotationList')}>
            {scopedAnnotations.map((annotation) => (
              <li
                key={annotation.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/90 bg-white/90 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-700">{annotation.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(annotation.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className={`${UI_BUTTON_GHOST_SM} h-8 min-w-0 px-2 text-[10px]`}
                  onClick={() => {
                    onDeleteAnnotation(annotation.id);
                  }}
                >
                  {t('annotationDelete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
