export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  roles: string[];
  tenantId?: string;
};

export type AuthSession = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  idToken?: string;
  user: AuthUser;
};

export type AuthSignInInput = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (_credentials?: AuthSignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  hasAnyRole: (_roles: string[]) => boolean;
  hasTenantContext: () => boolean;
};
