# Security Policy

## Supported Versions

This repository is in active development and only the latest `main` branch is supported.

## Reporting a Vulnerability

Do not open public issues for suspected vulnerabilities.

Preferred channels:

1. GitHub Security Advisory draft in this repository (private by default)
2. If advisories are unavailable, open a private report by contacting the repository owner directly

Please include:

- Affected commit SHA or tag
- Clear reproduction steps
- Impact and exploitability assessment
- Suggested mitigation (if known)

Response targets:

- Acknowledgement: within 2 business days
- Initial triage/severity: within 5 business days
- Remediation plan: shared after triage

## Disclosure Process

- We validate and classify severity.
- We prepare and test remediation.
- We coordinate disclosure timing with reporters for high-severity findings.
- We publish an advisory and changelog notes after remediation.

## Security Baseline

- Dependency updates are monitored via Dependabot and CI policy gates.
- CI checks must pass before merge.
- Runtime environment validation is required for deployable builds.
