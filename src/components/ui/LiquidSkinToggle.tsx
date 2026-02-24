import { useEffect, useState } from 'react';
import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';

type LiquidSkinState = 'on' | 'off';

const LIQUID_STORAGE_KEY = 'bdv_liquid_skin';

function resolveInitialState(): LiquidSkinState {
  if (typeof window === 'undefined') {
    return 'off';
  }
  const stored = window.localStorage.getItem(LIQUID_STORAGE_KEY);
  return stored === 'on' ? 'on' : 'off';
}

function applyLiquidState(state: LiquidSkinState) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (state === 'on') {
    root.dataset.liquid = 'on';
  } else {
    delete root.dataset.liquid;
  }
}

type LiquidSkinToggleProps = {
  className?: string;
};

export function LiquidSkinToggle({ className }: LiquidSkinToggleProps = {}) {
  const { t } = useI18n();
  const [state, setState] = useState<LiquidSkinState>(() => {
    const initial = resolveInitialState();
    if (typeof document !== 'undefined') {
      applyLiquidState(initial);
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    applyLiquidState(state);
    window.localStorage.setItem(LIQUID_STORAGE_KEY, state);
  }, [state]);

  const nextState = state === 'on' ? 'off' : 'on';

  return (
    <button
      type="button"
      className={`${UI_BUTTON_GHOST_SM} w-full min-w-0 sm:min-w-36 ${className ?? ''}`}
      aria-label={t('liquidSkinSwitchAria')}
      onClick={() => setState(nextState)}
    >
      {t('liquidSkin')}: {state === 'on' ? t('liquidSkinOn') : t('liquidSkinOff')}
    </button>
  );
}
