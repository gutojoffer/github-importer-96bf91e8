import { useNavigate } from 'react-router-dom';
import { Trophy, Zap } from 'lucide-react';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function SelectMode() {
  const navigate = useNavigate();
  const { setMode } = useActiveMode();
  const { profile, loading } = useUserProfile();
  const { user, loading: authLoading } = useAuth();

  // Se não tem dual profile, redireciona automaticamente
  useEffect(() => {
    if (loading || authLoading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (!profile) return;
    if (!profile.hasDualProfile) {
      const target = profile.tipoConta === 'blader'
        ? (profile.isComplete ? '/blader/home' : '/onboarding')
        : '/home';
      setMode(profile.tipoConta);
      navigate(target, { replace: true });
    }
  }, [profile, loading, authLoading, user, navigate, setMode]);

  const choose = (m: 'organizador' | 'blader') => {
    setMode(m);
    navigate(m === 'organizador' ? '/home' : '/blader/home', { replace: true });
  };

  if (loading || authLoading || !profile?.hasDualProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[480px] surface-panel p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-[0.12em]">
            BLADE<span className="text-primary">X</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-2">Como deseja entrar?</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => choose('organizador')}
            className="w-full p-5 rounded-xl text-center transition-all hover:scale-[1.02]"
            style={{ background: '#111827', border: '2px solid rgba(37,99,235,.3)' }}
          >
            <Trophy className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="font-heading font-bold text-foreground text-base mb-1">Entrar como Organizador</div>
            <div className="text-xs text-muted-foreground font-body">Gerencie sua liga e torneios</div>
          </button>

          <button
            type="button"
            onClick={() => choose('blader')}
            className="w-full p-5 rounded-xl text-center transition-all hover:scale-[1.02]"
            style={{ background: '#111827', border: '2px solid rgba(245,158,11,.3)' }}
          >
            <Zap className="h-8 w-8 mx-auto text-gold mb-2" />
            <div className="font-heading font-bold text-foreground text-base mb-1">Entrar como Blader</div>
            <div className="text-xs text-muted-foreground font-body">Participe de torneios e veja seu desempenho</div>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 font-body">
          Você pode trocar de modo a qualquer momento pelo menu do topo.
        </p>
      </div>
    </div>
  );
}
