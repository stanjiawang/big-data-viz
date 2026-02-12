# Auth Rollout Checklist

## Staging

- [ ] OIDC client configuration matches environment (issuer, client ID, redirect URI)
- [ ] Sign-in callback succeeds and dashboard renders for viewer role
- [ ] RBAC validation passed for viewer, analyst, and admin personas
- [ ] Tenant claim mapping verified for multi-tenant users
- [ ] Session refresh succeeds at least once before token expiry window
- [ ] Sign-out redirects to IdP logout and returns to app entry route

## Production Cutover

- [ ] Feature flag `VITE_ENABLE_AUTH` toggled to `true` in production
- [ ] `VITE_AUTH_PROVIDER` is set to `oidc` in production runtime config
- [ ] Runbook owner and on-call contact confirmed for release window
- [ ] Success criteria defined for first 60 minutes (auth failure rate, callback error rate)
- [ ] Rollback decision threshold agreed and communicated

## Rollback

- [ ] Fallback config (`VITE_ENABLE_AUTH=false`) is prepared and verified
- [ ] Cache/CDN invalidation plan for auth config updates is ready
- [ ] Customer support communication template is pre-approved
