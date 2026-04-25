import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { Camera, Check, ArrowRight, ArrowLeft, Sparkles, Info } from 'lucide-react';
import VincularBladersTempModal from '@/components/blader/VincularBladersTempModal';

const STEPS = ['Identidade', 'Seu Beyblade', 'Tudo pronto'] as const;

export default function CriarPerfilBlader() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { setMode, refreshProfiles } = useActiveMode();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [showVincular, setShowVincular] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [nomeBlader, setNomeBlader] = useState('');
  const [cidade, setCidade] = useState('');
  const [beybladeFavorita, setBeybladeFavorita] = useState('');
  const [bio, setBio] = useState('');

  // Guard: redirect if blader profile already exists
  useEffect(() => {
    if (profileLoading || authLoading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (profile?.temPerfilBlader && profile?.nomeBlader) {
      setMode('blader');
      navigate('/blader/home', { replace: true });
      return;
    }
    // Pre-fill cidade from org profile if available
    if (profile?.cidade && !cidade) setCidade(profile.cidade);
  }, [profile, profileLoading, authLoading, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('blader-avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro ao enviar foto'); setUploading(false); return; }
    const { data } = supabase.storage.from('blader-avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const handleNext = async () => {
    if (!user) return;
    setLoading(true);
    setErro(null);

    if (step === 0) {
      if (!nomeBlader.trim() || !cidade.trim()) {
        toast.error('Preencha nome e cidade');
        setLoading(false); return;
      }
      setStep(1);
    } else if (step === 1) {
      try {
        const dadosParaSalvar: Record<string, unknown> = {
          tem_perfil_blader: true,
          nome_blader: nomeBlader.trim(),
          cidade_blader: cidade.trim(),
          avatar_blader_url: avatarUrl || null,
          beyblade_favorita: beybladeFavorita.trim() || null,
          bio_blader: bio.trim() || null,
        };

        console.log('Salvando dados blader:', dadosParaSalvar, 'User:', user.id);

        // Try update first
        let { data, error } = await supabase
          .from('profiles')
          .update(dadosParaSalvar as any)
          .eq('id', user.id)
          .select();

        console.log('Resultado UPDATE:', { data, error });

        // Fallback to upsert if update returned no rows
        if (!error && (!data || data.length === 0)) {
          console.warn('UPDATE retornou 0 rows, tentando upsert');
          const { data: upsertData, error: upsertError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...dadosParaSalvar } as any, { onConflict: 'id' })
            .select();
          data = upsertData;
          error = upsertError;
          console.log('Resultado UPSERT:', { data: upsertData, error: upsertError });
        }

        if (error) {
          console.error('Erro Supabase:', error);
          setErro(`Erro ao salvar: ${error.message}`);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setErro('Perfil não encontrado. Contate o suporte.');
          setLoading(false);
          return;
        }

        await refreshProfiles();
        toast.success('Perfil de Blader criado com sucesso!');
        setStep(2);
        // Verificar vinculação pendente baseada no email
        if (user.email) setShowVincular(true);
      } catch (err: any) {
        console.error('Erro inesperado:', err);
        setErro('Erro inesperado. Tente novamente.');
      }
    } else {
      setMode('blader');
      navigate('/blader/home', { replace: true });
    }
    setLoading(false);
  };

  const handleStayAsOrg = () => {
    setMode('organizador');
    navigate('/home', { replace: true });
  };

  if (authLoading || profileLoading || !user) {
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
        <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.25)' }}>
          <Info size={16} className="shrink-0 mt-0.5" style={{ color: '#60A5FA' }} />
          <p className="text-xs font-body" style={{ color: '#BFDBFE', lineHeight: 1.5 }}>
            Você está criando um perfil de <strong>Blader</strong> para sua conta existente. Não é necessário criar um novo login.
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
                    background: i <= step ? '#F59E0B' : 'rgba(255,255,255,.06)',
                    color: i <= step ? '#0B0F1A' : 'rgba(255,255,255,.4)',
                  }}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-body whitespace-nowrap">
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 mx-2 mt-[-18px]" style={{ background: i < step ? '#F59E0B' : 'rgba(255,255,255,.08)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {step === 0 && 'Sua identidade no jogo'}
            {step === 1 && 'Conte sobre seu Beyblade'}
            {step === 2 && 'Pronto, Blader!'}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {step === 0 && 'Seu nome e foto como jogador'}
            {step === 1 && 'Personalize seu perfil'}
            {step === 2 && 'Para onde quer ir agora?'}
          </p>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer relative group">
                <div
                  className="h-[120px] w-[120px] rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.04)', border: '2px dashed rgba(255,255,255,.15)' }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              <span className="text-xs text-muted-foreground font-body">Foto de Blader (pode ser diferente da liga)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Nome de Blader *</label>
              <input
                type="text"
                value={nomeBlader}
                onChange={e => setNomeBlader(e.target.value)}
                placeholder="Como outros vão te ver"
                className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Cidade *</label>
              <input
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Beyblade favorita</label>
              <input
                type="text"
                value={beybladeFavorita}
                onChange={e => setBeybladeFavorita(e.target.value)}
                placeholder="Ex: Dranzer Spiral"
                className="w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">
                Bio <span className="text-muted-foreground/50">({bio.length}/140)</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 140))}
                maxLength={140}
                rows={3}
                placeholder="Conte um pouco sobre você"
                className="w-full px-3 py-2 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-body" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#F87171' }}>
            <span>⚠️</span>
            {erro}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={nomeBlader} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gold/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-gold" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-heading text-lg font-bold text-foreground truncate">{nomeBlader}</div>
                <div className="text-xs text-muted-foreground font-body truncate">📍 {cidade}</div>
                {beybladeFavorita && (
                  <div className="text-xs font-body truncate mt-0.5" style={{ color: '#FBBF24' }}>⚡ {beybladeFavorita}</div>
                )}
              </div>
            </div>
            {bio && <p className="text-sm text-muted-foreground font-body italic px-1">"{bio}"</p>}
            <p className="text-xs text-muted-foreground font-body text-center">
              Você pode trocar entre Organizador e Blader a qualquer momento pelo menu do topo.
            </p>
          </div>
        )}

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
              style={{ background: '#F59E0B', color: '#0B0F1A' }}
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-[#0B0F1A] border-t-transparent rounded-full animate-spin" />
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
              style={{ background: '#F59E0B', color: '#0B0F1A' }}
            >
              Ir para meu perfil Blader <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleStayAsOrg}
              className="h-10 rounded-lg font-body font-medium text-sm hover:bg-[hsl(var(--surface2))]/70 transition-colors"
              style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid rgba(255,255,255,.1)' }}
            >
              Continuar como Organizador
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
