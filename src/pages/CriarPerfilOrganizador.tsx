import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { toast } from 'sonner';
import { Camera, Check, ArrowRight, ArrowLeft, Trophy, Info } from 'lucide-react';

const STEPS = ['Sua Liga', 'Detalhes', 'Tudo pronto'] as const;

/**
 * Permite que um Blader (já logado) crie seu perfil de Organizador.
 * Marca tem_perfil_organizador = true e atribui role 'organizer'.
 */
export default function CriarPerfilOrganizador() {
  const { user, loading: authLoading } = useAuth();
  const { setMode } = useActiveMode();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [nomeLiga, setNomeLiga] = useState('');
  const [cidadeLiga, setCidadeLiga] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('cidade, tem_perfil_organizador')
        .eq('id', user.id)
        .maybeSingle();
      const dataAny = data as { cidade?: string; tem_perfil_organizador?: boolean } | null;
      if (dataAny?.tem_perfil_organizador) {
        navigate('/home', { replace: true });
        return;
      }
      if (dataAny?.cidade) setCidadeLiga(dataAny.cidade);
    })();
  }, [user, navigate]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('logos-ligas').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro ao enviar logo'); setUploading(false); return; }
    const { data } = supabase.storage.from('logos-ligas').getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  };

  const handleNext = async () => {
    if (!user) return;
    setLoading(true);

    if (step === 0) {
      if (!nomeLiga.trim() || !cidadeLiga.trim()) {
        toast.error('Preencha nome e cidade da liga');
        setLoading(false); return;
      }
      setStep(1);
    } else if (step === 1) {
      // Atualiza perfil com dados da liga + marca tem_perfil_organizador
      const { error } = await supabase.from('profiles').update({
        nome_liga: nomeLiga.trim(),
        logo_url: logoUrl || null,
        cidade: cidadeLiga.trim(),
        descricao: descricao.trim() || null,
        endereco: endereco.trim() || null,
        tem_perfil_organizador: true,
      } as never).eq('id', user.id);
      if (error) { toast.error('Erro ao salvar: ' + error.message); setLoading(false); return; }

      // Garante role de organizador
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'organizer')
        .maybeSingle();
      if (!existingRole) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'organizer' });
      }

      toast.success('Perfil de Organizador criado!');
      setStep(2);
    } else {
      setMode('organizador');
      navigate('/home', { replace: true });
    }
    setLoading(false);
  };

  const handleStayAsBlader = () => {
    setMode('blader');
    navigate('/blader/home', { replace: true });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060912' }}>
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060912' }}>
      <div
        className="w-full max-w-[480px] p-8 space-y-6"
        style={{ background: '#111827', borderRadius: 16, border: '1px solid rgba(255,255,255,.07)' }}
      >
        {/* Aviso */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)' }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: '#FBBF24' }} />
          <p className="text-xs font-body" style={{ color: '#FDE68A', lineHeight: 1.5 }}>
            Você está criando um perfil de <strong>Organizador</strong>. Poderá criar e gerenciar ligas e torneios.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center font-heading text-sm font-bold transition-all"
                  style={{
                    background: i <= step ? '#2563EB' : 'rgba(255,255,255,.06)',
                    color: i <= step ? '#fff' : 'rgba(255,255,255,.4)',
                  }}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-body whitespace-nowrap">
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 mx-2 mt-[-18px]" style={{ background: i < step ? '#2563EB' : 'rgba(255,255,255,.08)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {step === 0 && 'Identidade da Liga'}
            {step === 1 && 'Detalhes da Liga'}
            {step === 2 && 'Liga pronta!'}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {step === 0 && 'Logo, nome e cidade da sua liga'}
            {step === 1 && 'Informações opcionais para os bladers'}
            {step === 2 && 'Para onde quer ir agora?'}
          </p>
        </div>

        {/* Step 0 */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer relative group">
                <div
                  className="h-[120px] w-[120px] rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.04)', border: '2px dashed rgba(255,255,255,.15)' }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <span className="text-xs text-muted-foreground font-body">Logo da liga (proporção 1:1)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Nome da liga *</label>
              <input
                type="text"
                value={nomeLiga}
                onChange={e => setNomeLiga(e.target.value)}
                placeholder="Ex: Liga Beyblade SP"
                className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Cidade da liga *</label>
              <input
                type="text"
                value={cidadeLiga}
                onChange={e => setCidadeLiga(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">
                Descrição <span className="text-muted-foreground/50">({descricao.length}/280)</span>
              </label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value.slice(0, 280))}
                maxLength={280}
                rows={3}
                placeholder="Liga oficial de Beyblade X da região..."
                className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Endereço dos torneios</label>
              <input
                type="text"
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro"
                className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              {logoUrl ? (
                <img src={logoUrl} alt={nomeLiga} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-heading text-lg font-bold text-foreground truncate">{nomeLiga}</div>
                <div className="text-xs text-muted-foreground font-body truncate">📍 {cidadeLiga}</div>
              </div>
            </div>
            {descricao && <p className="text-sm text-muted-foreground font-body italic px-1">"{descricao}"</p>}
            <p className="text-xs text-muted-foreground font-body text-center">
              Você pode trocar entre Blader e Organizador a qualquer momento pelo menu do topo.
            </p>
          </div>
        )}

        {/* Navigation */}
        {step < 2 ? (
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="h-10 px-4 rounded-lg bg-[hsl(var(--surface2))] text-foreground font-body font-medium text-sm hover:bg-[hsl(var(--surface2))]/70 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || uploading}
              className="flex-1 h-10 rounded-lg font-body font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style={{ background: '#2563EB', color: '#fff' }}
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Próximo <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="h-10 rounded-lg font-body font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              style={{ background: '#2563EB', color: '#fff' }}
            >
              Ir para painel do Organizador <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleStayAsBlader}
              className="h-10 rounded-lg font-body font-medium text-sm hover:bg-[hsl(var(--surface2))]/70 transition-colors"
              style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid rgba(255,255,255,.1)' }}
            >
              Continuar como Blader
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
