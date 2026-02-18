import { useId, type DragEvent, type ReactNode, type RefObject } from 'react';
import { UI_TEXT_MUTED_SM, UI_TEXT_SUBTITLE } from '@/components/ui/styleTokens';

type CardProps = {
  title: string;
  description?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  actions?: ReactNode;
  sectionRef?: RefObject<HTMLElement | null>;
  dragHandle?: {
    ariaLabel?: string;
    isDragging?: boolean;
    onDragStart: (_event: DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
  };
};

export function Card({
  title,
  description,
  subtitle,
  children,
  className,
  contentClassName,
  actions,
  sectionRef,
  dragHandle,
}: CardProps) {
  const headingId = useId();

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={`ui-card-shell rounded-2xl border p-5 shadow-[0_6px_20px_rgb(15_23_42/6%)] backdrop-blur-[1px] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_rgb(15_23_42/9%)] ${className ?? ''}`}
    >
      <div
        draggable={Boolean(dragHandle)}
        aria-label={dragHandle?.ariaLabel}
        className={`ui-card-head min-h-20 rounded-xl border px-4 py-3 ${
          dragHandle?.isDragging
            ? 'cursor-grabbing border-blue-300'
            : dragHandle
              ? 'cursor-grab'
              : ''
        }`}
        onDragStart={(event) => {
          if (!dragHandle) return;
          const target = event.target as HTMLElement | null;
          if (
            target?.closest(
              'button,a,input,select,textarea,label,[role="button"],[data-drag-ignore="true"]',
            )
          ) {
            event.preventDefault();
            return;
          }
          dragHandle.onDragStart(event);
        }}
        onDragEnd={() => {
          dragHandle?.onDragEnd();
        }}
      >
        <div className="flex flex-col items-start justify-between gap-2.5 sm:flex-row sm:gap-4">
          <div className="min-w-0 space-y-1.5">
            <h3
              id={headingId}
              className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600"
            >
              {title}
            </h3>
            {description ? (
              <p className={`${UI_TEXT_SUBTITLE} min-h-6 text-[1.03rem] leading-snug`}>
                {description}
              </p>
            ) : null}
            {subtitle ? (
              <p className={`${UI_TEXT_MUTED_SM} min-h-5 text-xs uppercase tracking-[0.07em]`}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 self-start pt-0.5 sm:w-auto">
            {actions}
          </div>
        </div>
      </div>
      {children ? <div className={`mt-4 ${contentClassName ?? ''}`}>{children}</div> : null}
    </section>
  );
}
