import { UI_TEXT_SUBTITLE, UI_TEXT_TITLE_XL } from '@/components/ui/styleTokens';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="min-h-[7.5rem] space-y-2.5">
      <h1 className={UI_TEXT_TITLE_XL}>{title}</h1>
      {subtitle ? <p className={`${UI_TEXT_SUBTITLE} max-w-2xl`}>{subtitle}</p> : null}
    </header>
  );
}
