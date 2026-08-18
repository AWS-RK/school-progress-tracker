import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import SignIn from './SignIn';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <SignIn />;
  return <>{children}</>;
}
