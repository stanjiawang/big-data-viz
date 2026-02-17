# Release Checklist

- [ ] Version and scope are finalized
- [ ] Changelog entry is updated
- [ ] Reliability, performance, and contract gates passed
- [ ] Accessibility e2e gate passed (`pnpm run test:e2e:a11y`)
- [ ] i18n smoke check completed for `en` and `zh-CN`
- [ ] Demo build validated (`pnpm run build:demo`)
- [ ] Demo package verification passed (`pnpm run demo:verify`)
- [ ] Quality dashboard artifact generated (`pnpm run quality:dashboard`)
- [ ] Security header profile verified for deployment target (`public/_headers` or `vercel.json`)
- [ ] Auth session storage mode reviewed (`VITE_AUTH_SESSION_STORAGE=session` by default)
- [ ] Dependency policy gate passed (`pnpm run test:dependency-policy`)
- [ ] SBOM artifact generated and attached (`artifacts/sbom.cdx.json`)
- [ ] Rollback plan and owner confirmed
- [ ] Post-release monitoring window scheduled
- [ ] Auth rollout checklist completed for the target environment
