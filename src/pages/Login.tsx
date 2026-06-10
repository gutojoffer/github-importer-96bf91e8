import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { verificarEExecutarMatch } from '@/lib/bladerMatch';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Se a sessao ja existe, manda direto pro app (evita "tela de login piscando")
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/select-mode', { replace: true });
    }
  }, [authLoading, user, navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // anti double-submit
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError('Email ou senha incorretos.');
      return;
    }
    // Match não pode bloquear o login se falhar
    if (data.user) {
      try { await verificarEExecutarMatch(data.user.id, data.user.email); } catch {}
    }
    setLoading(false);
    navigate('/select-mode');
  };

  return (
    <div className="flex items-center justify-center bg-background p-4 relative" style={{ minHeight: '100dvh' }}>
      <div className="w-full max-w-[400px] surface-panel p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-[0.12em]">
            BLADE<span className="text-primary">X</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Acesso para organizadores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              placeholder="email@liga.com" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Senha</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full h-10 px-3 pr-10 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn className="h-4 w-4" /> Entrar</>}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:text-primary transition-colors font-body">
            Esqueci minha senha
          </Link>
          <p className="text-sm text-muted-foreground font-body">
            <Link to="/cadastro" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Criar conta da liga
            </Link>
          </p>
        </div>
      </div>

      {/* Links para páginas públicas */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          gap: 18,
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '0 16px',
        }}
      >
        {[
          { href: '/ranking', label: '🏅 Ranking' },
          { href: '/torneios-publicos', label: '🏆 Torneios' },
          { href: '/beyblade-x', label: '⚡ Beyblade X' },
          { href: '/sobre', label: 'ℹ️ Sobre o BLADEX' },
        ].map((l) => (
          <Link
            key={l.href}
            to={l.href}
            style={{
              color: 'rgba(255,255,255,.4)',
              textDecoration: 'none',
              fontSize: 12,
              transition: 'color .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00DCFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.4)')}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
