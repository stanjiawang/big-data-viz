import { UI_CHIP_NEUTRAL } from '@/components/ui/styleTokens';

type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  return <span className={UI_CHIP_NEUTRAL}>{label}</span>;
}
