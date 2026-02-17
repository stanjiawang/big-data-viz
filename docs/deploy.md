# Deployment Guide

This project supports free deployment on Vercel and Cloudflare Pages.

## Prerequisites

- Node.js 20+
- `pnpm`
- Project builds locally:
  - `pnpm install`
  - `pnpm run build:demo`

## Demo Runtime Profile

Use demo mode for public interview links:

- `VITE_RUNTIME_PROFILE=demo`
- MSW enabled by default
- Auth disabled by default
- Telemetry disabled by default

You can run demo mode locally with:

```bash
pnpm run dev:demo
```

## Vercel (Free Tier)

1. Import the GitHub repo in Vercel.
2. Framework preset: `Vite`.
3. Build command: `pnpm run build:demo`
4. Output directory: `dist`
5. Set env var:
   - `VITE_RUNTIME_PROFILE=demo`
6. Deploy.

`vercel.json` in repo already includes security headers.

## Cloudflare Pages (Free Tier)

1. Create a Pages project from the GitHub repo.
2. Build command: `pnpm run build:demo`
3. Build output directory: `dist`
4. Set env var:
   - `VITE_RUNTIME_PROFILE=demo`
5. Deploy.

`public/_headers` in repo contains CSP and security header policy.

## Quick Verification

After deployment, verify:

1. App loads and chart/table cards render.
2. Sign-in is not required in demo mode.
3. Security headers are present on static responses.
4. Language/theme toggles and detail views work.
