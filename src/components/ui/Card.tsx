import type { ReactNode } from 'react';

type CardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Card({ title, description, children, className, contentClassName }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className ?? ''}`}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {children ? <div className={`mt-4 ${contentClassName ?? ''}`}>{children}</div> : null}
    </section>
  );
}
