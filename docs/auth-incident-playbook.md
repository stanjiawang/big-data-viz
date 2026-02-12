# Auth Incident Playbook

## Scope

Use this playbook for authentication availability regressions during or after OIDC rollout.

## Trigger Signals

- Elevated `auth.callback.failed` telemetry events
- Elevated `auth.session.refresh_failed` telemetry events
- Sign-in conversion drop in staging or production release window

## Triage Steps

1. Confirm current runtime auth settings (`VITE_ENABLE_AUTH`, `VITE_AUTH_PROVIDER`, OIDC endpoints).
2. Validate IdP health status and token endpoint availability.
3. Inspect recent deploy diff for auth config, redirect URI, or claim mapping changes.
4. Verify callback and refresh failures by tenant and role cohort.

## Mitigation

1. Roll back to known-good auth config if failure threshold is exceeded.
2. Disable auth gate temporarily (`VITE_ENABLE_AUTH=false`) only with incident commander approval.
3. Announce user-facing impact and workaround in status channel.

## Recovery Verification

1. Confirm sign-in success for viewer, analyst, and admin personas.
2. Confirm session refresh success after expiry skew window.
3. Confirm telemetry error rate returned to baseline.
