import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, UserPlus, Trophy, Zap, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type TipoConta = 'organizador' | 'blader';

export default function Register() {
  const [step, setStep] = useState<'tipo' | 'form'>('tipo');
  const [tipoConta, setTipoConta] = useState<TipoConta | null>(null);

  // Organizador
  const [nomeLiga, setNomeLiga] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');

  // Comum
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pré-seleciona tipo via ?tipo=organizador|blader
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tipo');
    if (t === 'organizador' || t === 'blader') {
      setTipoConta(t);
      setStep('form');
    }
  }, [location.search]);

  const inputClass = "w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors";

  const handleSelectTipo = (t: TipoConta) => {
    setTipoConta(t);
    setStep('form');
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tipoConta === 'organizador' && !nomeLiga.trim()) {
      setError('Nome da liga é obrigatório.');
      return;
    }
    if (password !== confirmPw) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

    setLoading(true);
    const metadata: Record<string, string> = { tipo_conta: tipoConta! };
    if (tipoConta === 'organizador') {
      metadata.nome_liga = nomeLiga.trim();
      metadata.descricao = descricao.trim();
      metadata.cidade = cidade.trim();
      metadata.endereco = endereco.trim();
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        setError('Este email já está cadastrado. Faça login e ative o perfil de Blader nas Configurações.');
      } else {
        setError(error.message);
      }
    } else {
      toast.success('Conta criada! Verifique seu email para confirmar.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[440px] surface-panel p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-[0.12em]">
            BLADE<span className="text-primary">X</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {step === 'tipo' ? 'Escolha o tipo de conta' : tipoConta === 'organizador' ? 'Criar conta da liga' : 'Criar conta de Blader'}
          </p>
        </div>

        {step === 'tipo' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSelectTipo('organizador')}
              className="w-full p-5 rounded-xl text-center transition-all hover:scale-[1.02]"
              style={{
                background: '#111827',
                border: `2px solid ${tipoConta === 'organizador' ? 'rgba(37,99,235,.3)' : 'rgba(255,255,255,.07)'}`,
              }}
            >
              <div className="text-3xl mb-2"><Trophy className="h-8 w-8 mx-auto text-primary" /></div>
              <div className="font-heading font-bold text-foreground text-base mb-1">Organizador</div>
              <div className="text-xs text-muted-foreground font-body">Crie e gerencie ligas e torneios</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTipo('blader')}
              className="w-full p-5 rounded-xl text-center transition-all hover:scale-[1.02]"
              style={{
                background: '#111827',
                border: `2px solid ${tipoConta === 'blader' ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.07)'}`,
              }}
            >
              <div className="text-3xl mb-2"><Zap className="h-8 w-8 mx-auto text-gold" /></div>
              <div className="font-heading font-bold text-foreground text-base mb-1">Blader</div>
              <div className="text-xs text-muted-foreground font-body">Participe de torneios e acompanhe seu desempenho</div>
            </button>

            <p className="text-center text-sm text-muted-foreground font-body pt-2">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">Fazer login</Link>
            </p>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <button
              type="button"
              onClick={() => { setStep('tipo'); setError(''); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Trocar tipo de conta
            </button>

            {tipoConta === 'organizador' && (
              <>
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
              </>
            )}

            {tipoConta === 'blader' && (
              <p className="text-xs text-muted-foreground font-body bg-[hsl(var(--surface2))]/40 px-3 py-2 rounded-lg">
                Você completará seu perfil de Blader após o primeiro login (foto, nome, cidade e Beyblade favorita).
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="email@exemplo.com" />
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

            <p className="text-center text-sm text-muted-foreground font-body">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">Fazer login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
