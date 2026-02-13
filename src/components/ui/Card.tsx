import type { ReactNode, RefObject } from 'react';
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
  return (
    <section
      ref={sectionRef}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className={UI_LABEL_CLASS}>{title}</h3>
          {description ? <p className={UI_TEXT_SUBTITLE}>{description}</p> : null}
          {subtitle ? (
            <p className={`${UI_TEXT_MUTED_SM} text-xs uppercase tracking-wide`}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className={`mt-4 ${contentClassName ?? ''}`}>{children}</div> : null}
    </section>
  );
}
