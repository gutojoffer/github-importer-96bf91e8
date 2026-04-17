import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Roteia o usuário pós-login conforme seu tipo de conta:
 * - Blader sem perfil completo → /onboarding
 * - Blader com perfil completo → /blader/home
 * - Organizador → segue para a rota original (children)
 *
 * Use como wrapper das rotas do organizador.
 */
export default function AccountRouter({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const location = useLocation();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-body">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.tipoConta === 'blader') {
    if (!profile.isComplete && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    if (profile.isComplete && !location.pathname.startsWith('/blader')) {
      return <Navigate to="/blader/home" replace />;
    }
  }

  return <>{children}</>;
}
