import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [nomeLiga, setNomeLiga] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPw) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!nomeLiga.trim()) {
      setError('Nome da liga é obrigatório.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome_liga: nomeLiga.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      toast.success('Conta criada! Verifique seu email para confirmar.');
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
          <p className="text-sm text-muted-foreground font-body mt-1">Criar conta da liga</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Nome da Liga</label>
            <input
              type="text"
              value={nomeLiga}
              onChange={e => setNomeLiga(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              placeholder="Minha Liga Beyblade"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              placeholder="email@liga.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Senha</label>
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
            <label className="text-xs font-body font-medium text-muted-foreground">Confirmar Senha</label>
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
                <UserPlus className="h-4 w-4" /> Criar Conta
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
