import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SetupAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: hasAdmin } = await supabase.rpc('has_any_admin' as any);
      if (hasAdmin) {
        navigate('/login', { replace: true });
        return;
      }
      setLoading(false);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !user) {
        toast.error('Email ou senha incorretos');
        return;
      }

      // Double-check no admin exists
      const { data: hasAdmin } = await supabase.rpc('has_any_admin' as any);
      if (hasAdmin) {
        toast.error('Já existe um administrador cadastrado');
        return;
      }

      // Call edge function to promote (uses service role)
      const { data: session } = await supabase.auth.getSession();
      const { error: fnError } = await supabase.functions.invoke('setup-admin', {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (fnError) {
        toast.error('Erro ao promover usuário: ' + fnError.message);
        return;
      }

      toast.success('Você agora é administrador do sistema!');
      navigate('/admin', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#060912', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ background: '#060912', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: 420, background: '#111827',
        border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: 32,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #1e3a8a, #2563EB)',
              border: '1px solid rgba(37,99,235,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff'
            }}>BX</div>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: 0.5 }}>
              BLADE<span style={{ color: '#60A5FA' }}>X</span>
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#fff', margin: 0 }}>
            Configuração inicial
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>
            Defina o administrador do sistema. Isso só pode ser feito uma vez.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94A3B8', marginBottom: 6 }}>Seu email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.04)', color: '#E2E8F0', padding: '0 14px', fontSize: 14,
                outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="admin@email.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94A3B8', marginBottom: 6 }}>Sua senha</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.04)', color: '#E2E8F0', padding: '0 14px', fontSize: 14,
                outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit" disabled={submitting}
          style={{
            width: '100%', height: 46, borderRadius: 10, border: 'none',
            background: submitting ? '#1e3a8a' : 'linear-gradient(135deg, #1e3a8a, #2563EB)',
            color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15,
            cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
            transition: 'all 0.15s'
          }}
        >
          {submitting ? 'Processando...' : 'Tornar-me admin'}
        </button>
      </form>
    </div>
  );
}
