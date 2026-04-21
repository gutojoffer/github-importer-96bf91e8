import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveMode } from '@/contexts/ActiveModeContext';

/**
 * Roteia o usuário pós-login conforme seu tipo de conta + modo ativo.
 */
export default function AccountRouter({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { mode } = useActiveMode();
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
  if (!profile) return <>{children}</>;

  // Blader puro precisa completar perfil
  if (profile.tipoConta === 'blader' && !profile.nomeBlader && !profile.isComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Conta com 2 perfis e sem modo escolhido
  if (profile.hasDualProfile && !mode) {
    return <Navigate to="/select-mode" replace />;
  }

  const effectiveMode = mode ?? profile.tipoConta;
  if (effectiveMode === 'blader' && profile.isComplete && !location.pathname.startsWith('/blader')) {
    return <Navigate to="/blader/home" replace />;
  }
  if (effectiveMode === 'organizador' && location.pathname.startsWith('/blader')) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
