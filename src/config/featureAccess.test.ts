import type { AuthSession } from '@/auth/types';
import {
  FEATURE_ROLE_REQUIREMENTS,
  canAccessFeature,
  hasAnyRequiredRole,
} from '@/config/featureAccess';

function createSession(roles: string[]): AuthSession {
  return {
    accessToken: 'token',
    expiresAt: Date.now() + 60_000,
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      roles,
      tenantId: 'tenant-1',
    },
  };
}

describe('featureAccess', () => {
  it('returns true when required role list is empty', () => {
    expect(hasAnyRequiredRole(createSession(['viewer']), [])).toBe(true);
  });

  it('returns false when no session exists for required roles', () => {
    expect(hasAnyRequiredRole(null, ['admin'])).toBe(false);
  });

  it('returns true when session contains one required role', () => {
    expect(hasAnyRequiredRole(createSession(['viewer', 'analyst']), ['analyst', 'admin'])).toBe(
      true,
    );
  });

  it('returns false when session does not contain required role', () => {
    expect(hasAnyRequiredRole(createSession(['viewer']), ['analyst', 'admin'])).toBe(false);
  });

  it('bypasses feature checks when auth is disabled', () => {
    expect(canAccessFeature(null, 'compare_mode', false)).toBe(true);
  });

  it('enforces compare role requirements when auth is enabled', () => {
    expect(canAccessFeature(createSession(['viewer']), 'compare_mode', true)).toBe(false);
    expect(canAccessFeature(createSession(['analyst']), 'compare_mode', true)).toBe(true);
    expect(FEATURE_ROLE_REQUIREMENTS.compare_mode).toEqual(['analyst', 'admin']);
  });
});
