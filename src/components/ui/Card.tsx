import { useId, type ReactNode, type RefObject } from 'react';
import { UI_LABEL_CLASS, UI_TEXT_MUTED_SM, UI_TEXT_SUBTITLE } from '@/components/ui/styleTokens';

type CardProps = {
  title: string;
  description?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  actions?: ReactNode;
  sectionRef?: RefObject<HTMLElement | null>;
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
}: CardProps) {
  const headingId = useId();

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex min-h-24 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 id={headingId} className={UI_LABEL_CLASS}>
            {title}
          </h3>
          {description ? <p className={`${UI_TEXT_SUBTITLE} min-h-6`}>{description}</p> : null}
          {subtitle ? (
            <p className={`${UI_TEXT_MUTED_SM} min-h-5 text-xs uppercase tracking-wide`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0 pt-1">{actions}</div> : null}
      </div>
      {children ? <div className={`mt-4 ${contentClassName ?? ''}`}>{children}</div> : null}
    </section>
  );
}
