import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';

const HERO_BADGES = [
  { label: 'Neural ops', value: '120ms' },
  { label: 'Throughput', value: '1.2B rows/s' },
  { label: 'Cold start', value: '1.8s' },
];

const GLASS_SECTIONS = [
  {
    title: 'Glass Cards',
    description: 'Specular highlights, layered blur, and soft shadow stacks.',
    items: [
      'Radial accents that react to pointer movement',
      'Borderless metrics with translucent dividers',
      'Ambient gradients tuned for both light and dark modes',
    ],
  },
  {
    title: 'Liquid Controls',
    description: 'Buttons and pills inherit surface depth and animated glows.',
    items: [
      'Hover lifts with subtle y-translation',
      'State-driven sheen for CTA buttons',
      'Icon+label chips for context-aware filtering',
    ],
  },
];

export function GlassPrototypePage() {
  return (
    <div className="glass-bg min-h-screen px-6 py-10 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="glass-card rounded-[32px] border px-8 py-10 text-left text-slate-900 dark:text-slate-100">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Apple liquid glass prototype
          </p>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Atmospheric telemetry for AI data workspaces
              </h1>
              <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-300">
                This labs page renders a possible \"liquid\" skin that mixes translucent cards,
                specular caps, and soft gradients. It reuses the existing layout grid so we can
                validate feasibility without touching core dashboard flows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {HERO_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="glass-pill rounded-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200"
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                    {badge.label}
                  </p>
                  <p className="text-base font-semibold">{badge.value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          {GLASS_SECTIONS.map((section) => (
            <article
              key={section.title}
              className="glass-card rounded-[28px] border px-7 py-8 text-slate-900 dark:text-slate-100"
            >
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {section.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-200">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`${UI_BUTTON_GHOST_SM} glass-pill border-none bg-transparent px-6 text-slate-700 dark:text-slate-200`}
                >
                  Try CTA
                </button>
                <button
                  type="button"
                  className="glass-pill rounded-full px-6 py-2 text-sm font-semibold text-slate-800 shadow-[0_15px_30px_rgb(15_23_42/25%)] dark:text-slate-100"
                >
                  Secondary action
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="glass-card rounded-[32px] border px-7 py-8 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Prototype status</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                This route is isolated from production routes and pulls mocked telemetry to keep
                render budgets predictable. If we upstream the look, we can reuse these classes
                inside our shared Card/Button primitives.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-right text-sm text-slate-500 dark:text-slate-300">
              <span>Design system impact: Medium</span>
              <span>Perf impact: TBD (profiling in-progress)</span>
              <span>Auth gating: same as dashboard</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
