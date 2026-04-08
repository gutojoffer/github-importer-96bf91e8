import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Informe seu email.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] surface-panel p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-[0.12em]">
            ARENA <span className="text-primary">X</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Recuperar senha</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 border border-primary/20">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-foreground font-body">
              Verifique seu email. Enviamos um link para redefinir sua senha.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-body"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Mail className="h-4 w-4" /> Enviar link de recuperação
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground font-body">
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center justify-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
