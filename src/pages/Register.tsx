import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [nomeLiga, setNomeLiga] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputClass = "w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nomeLiga.trim()) { setError('Nome da liga é obrigatório.'); return; }
    if (password !== confirmPw) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_liga: nomeLiga.trim(),
          descricao: descricao.trim(),
          cidade: cidade.trim(),
          endereco: endereco.trim(),
        },
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
      <div className="w-full max-w-[440px] surface-panel p-8 space-y-6">
        <div className="text-center">
          <img src="/logo-bladex.png" alt="BLADEX" style={{ width: 220, height: 'auto', objectFit: 'contain', mixBlendMode: 'screen', margin: '0 auto 20px', display: 'block' }} />
          <p className="text-sm text-muted-foreground font-body mt-1">Criar conta da liga</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Liga info */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Nome da Liga *</label>
            <input type="text" value={nomeLiga} onChange={e => setNomeLiga(e.target.value)} required className={inputClass} placeholder="Minha Liga Beyblade" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">
              Descrição <span className="text-muted-foreground/50">({descricao.length}/280)</span>
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value.slice(0, 280))}
              maxLength={280}
              rows={2}
              className={`${inputClass} h-auto py-2 resize-none`}
              placeholder="Liga oficial de Beyblade X da região ABC"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Cidade</label>
              <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className={inputClass} placeholder="São Paulo" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Endereço</label>
              <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} className={inputClass} placeholder="Rua, número" />
            </div>
          </div>

          <div className="h-px bg-border/30 my-1" />

          {/* Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="email@liga.com" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Senha *</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className={`${inputClass} pr-10`} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-muted-foreground">Confirmar Senha *</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required className={inputClass} placeholder="••••••••" />
          </div>

          {error && (
            <p className="text-xs text-destructive font-body bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-body font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="h-4 w-4" /> Criar Conta</>}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
