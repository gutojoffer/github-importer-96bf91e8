import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Supabase injects access_token in the URL hash for recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Supabase client auto-handles the token from the URL
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPw) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      toast.success('Senha alterada com sucesso!');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] surface-panel p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-[0.12em]">
            ARENA <span className="text-primary">X</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Definir nova senha</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Nova senha</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 pr-10 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" /> Alterar senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
