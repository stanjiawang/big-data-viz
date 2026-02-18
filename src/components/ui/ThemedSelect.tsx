import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { UI_SELECT_MD } from '@/components/ui/styleTokens';

type SelectOption = {
  label: string;
  value: string;
};

type ThemedSelectProps = {
  ariaLabel: string;
  value: string;
  options: SelectOption[];
  onChange: (_value: string) => void;
  className?: string;
  triggerClassName?: string;
  listClassName?: string;
  disabled?: boolean;
  leadingIcon?: ReactNode;
};

export function ThemedSelect({
  ariaLabel,
  value,
  options,
  onChange,
  className,
  triggerClassName,
  listClassName,
  disabled,
  leadingIcon,
}: ThemedSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const listboxId = useId();
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0] ?? null,
    [options, value],
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      {leadingIcon ? (
        <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-slate-500">
          {leadingIcon}
        </span>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        disabled={disabled}
        className={`${UI_SELECT_MD} h-9 w-full text-left text-xs ${leadingIcon ? 'pl-8' : 'pl-2'} pr-7 ${triggerClassName ?? ''}`}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className="block truncate">{selectedOption?.label ?? ''}</span>
      </button>
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
      {open && menuStyle
        ? createPortal(
            <ul
              ref={menuRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                position: 'fixed',
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
              }}
              className={`z-[200] max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${listClassName ?? ''}`}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-800'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      } whitespace-nowrap`}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
