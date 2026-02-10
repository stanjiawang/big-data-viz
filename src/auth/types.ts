export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
};

export type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  hasAnyRole: (_roles: string[]) => boolean;
};
