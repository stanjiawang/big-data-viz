import type { AuthSession } from '@/auth/types';

export const FEATURE_ROLE_REQUIREMENTS = {
  compare_mode: ['analyst', 'admin'],
} as const;

export type FeaturePermission = keyof typeof FEATURE_ROLE_REQUIREMENTS;

export function hasAnyRequiredRole(session: AuthSession | null, requiredRoles: readonly string[]) {
  if (requiredRoles.length === 0) {
    return true;
  }

  if (!session) {
    return false;
  }

  return requiredRoles.some((role) => session.user.roles.includes(role));
}

export function canAccessFeature(
  session: AuthSession | null,
  feature: FeaturePermission,
  authEnabled: boolean,
) {
  if (!authEnabled) {
    return true;
  }

  return hasAnyRequiredRole(session, FEATURE_ROLE_REQUIREMENTS[feature]);
}
