# Demo Handoff Guide

This guide is for sharing the project with interviewers as a polished public demo.

## 1. Build Demo Profile

```bash
pnpm install
pnpm run build:demo
pnpm run demo:verify
```

## 2. Deploy

Follow `docs/deploy.md` and use demo runtime configuration:

- `VITE_RUNTIME_PROFILE=demo`

## 3. Quality Evidence

In CI, attach and share:

- `quality-dashboard` artifact bundle
- `sbom-cyclonedx` artifact

Minimum proof points:

- Bundle performance budget pass
- Render performance budget pass
- Accessibility e2e pass
- Coverage report artifact generated

## 4. Interviewer Walkthrough Checklist

1. Dashboard load and responsive layout on desktop/mobile.
2. Chart interactions (filtering, detail views, export image).
3. Graph interactions and table virtualization.
4. Language and theme toggles.
5. Explain mock vs production runtime profile split.

## 5. Troubleshooting

- If build fails, run `pnpm run typecheck` and `pnpm run lint`.
- If render benchmark fails in CI, inspect `artifacts/render-benchmark.json`.
- If demo verification fails, ensure `dist/index.html` exists and `.env.demo` is unchanged.
