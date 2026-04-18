import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Camera, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const STEPS = ['Identidade', 'Seu Beyblade', 'Tudo pronto'] as const;

export default function BladerOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [beybladeFavorita, setBeybladeFavorita] = useState('');
  const [bio, setBio] = useState('');

  // Carrega perfil existente
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tipo_conta, nome_liga, cidade, beyblade_favorita, avatar_url, bio')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        if (data.tipo_conta !== 'blader') {
          // não é blader → tira do onboarding
          navigate('/home', { replace: true });
          return;
        }
        setNome(data.nome_liga || '');
        setCidade(data.cidade || '');
        setBeybladeFavorita(data.beyblade_favorita || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');

        // Se já está completo, vai direto pro dashboard
        if (data.nome_liga && data.cidade) {
          navigate('/blader/home', { replace: true });
        }
      }
    })();
  }, [user, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('blader-avatars').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Erro ao enviar foto');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('blader-avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const saveStep = async (patch: Record<string, unknown>) => {
    if (!user) return false;
    const { error } = await supabase.from('profiles').update(patch as never).eq('id', user.id);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return false; }
    return true;
  };

  const handleNext = async () => {
    setLoading(true);

    if (step === 0) {
      if (!nome.trim() || !cidade.trim()) {
        toast.error('Preencha seu nome e cidade');
        setLoading(false);
        return;
      }
      const ok = await saveStep({ nome_liga: nome.trim(), cidade: cidade.trim(), avatar_url: avatarUrl || null });
      if (ok) setStep(1);
    } else if (step === 1) {
      const ok = await saveStep({
        beyblade_favorita: beybladeFavorita.trim() || null,
        bio: bio.trim() || null,
      });
      if (ok) setStep(2);
    } else {
      navigate('/blader/home', { replace: true });
    }

    setLoading(false);
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
                <div
                  className="h-px flex-1 mx-2 mt-[-18px]"
                  style={{ background: i < step ? '#F59E0B' : 'rgba(255,255,255,.08)' }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {step === 0 && 'Quem é você, Blader?'}
            {step === 1 && 'Conte sobre seu Beyblade'}
            {step === 2 && 'Tudo pronto!'}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {step === 0 && 'Configure sua identidade no sistema'}
            {step === 1 && 'Personalize seu perfil'}
            {step === 2 && 'Confira seu perfil e entre no sistema'}
          </p>
        </div>

        {/* Step 0 — Identidade */}
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
              <span className="text-xs text-muted-foreground font-body">Clique para enviar uma foto</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Seu nome de Blader *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Akira"
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

        {/* Step 1 — Beyblade */}
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

        {/* Step 2 — Resumo */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={nome} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-heading text-lg font-bold text-foreground truncate">{nome}</div>
                <div className="text-xs text-muted-foreground font-body truncate">📍 {cidade}</div>
                {beybladeFavorita && (
                  <div className="text-xs text-gold font-body truncate mt-0.5">⚡ {beybladeFavorita}</div>
                )}
              </div>
            </div>
            {bio && (
              <p className="text-sm text-muted-foreground font-body italic px-1">"{bio}"</p>
            )}
            <p className="text-xs text-muted-foreground font-body text-center">
              Você poderá editar tudo isso depois nas configurações.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 0 && step < 2 && (
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
            ) : step === 2 ? (
              <>Entrar no sistema <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Próximo <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
