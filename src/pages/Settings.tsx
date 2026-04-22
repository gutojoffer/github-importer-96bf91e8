import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Upload, Trash2, ImageIcon, Save, Building, MapPin, FileText, Zap, Palette, Check, User, Camera } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useLiga } from '@/contexts/LigaContext';
import LigaLogo from '@/components/LigaLogo';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useNavigate } from 'react-router-dom';
import { BLADER_COLOR_KEYS, BLADER_COLORS, getBladerGradient, type BladerColorKey } from '@/lib/bladerColors';
import BladerAvatar from '@/components/BladerAvatar';

export default function Settings() {
  const { nomeLiga, descricao, cidade, endereco, logoUrl, updateLiga, uploadLogo, removeLogo } = useLiga();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useUserProfile();
  const { user } = useAuth();
  const { mode, perfis, refreshProfiles, setMode } = useActiveMode();
  const navigate = useNavigate();

  // Determine which mode we're in
  const currentMode = mode ?? profile?.tipoConta ?? 'organizador';
  const isBladerMode = currentMode === 'blader';

  // --- Blader settings state ---
  const [bladerNome, setBladerNome] = useState('');
  const [bladerCidade, setBladerCidade] = useState('');
  const [bladerBio, setBladerBio] = useState('');
  const [bladerBeyblade, setBladerBeyblade] = useState('');
  const [savingBlader, setSavingBlader] = useState(false);
  const [bladerAvatarUploading, setBladerAvatarUploading] = useState(false);

  // Color
  const [savingColor, setSavingColor] = useState<BladerColorKey | null>(null);
  const [localColor, setLocalColor] = useState<BladerColorKey>('blue');

  // --- Org settings state ---
  const [formNome, setFormNome] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCidade, setFormCidade] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [savingLiga, setSavingLiga] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync from profile
  useEffect(() => {
    if (!profile) return;
    setBladerNome(profile.nomeBlader || '');
    setBladerCidade(profile.cidadeBlader || profile.cidade || '');
    setBladerBio(profile.bioBlader || '');
    setBladerBeyblade(profile.beybladeFavorita || '');
    if (profile.corPerfil && BLADER_COLOR_KEYS.includes(profile.corPerfil as BladerColorKey)) {
      setLocalColor(profile.corPerfil as BladerColorKey);
    }
  }, [profile]);

  useEffect(() => {
    setFormNome(nomeLiga);
    setFormDesc(descricao);
    setFormCidade(cidade);
    setFormEndereco(endereco);
  }, [nomeLiga, descricao, cidade, endereco]);

  const inputClass = "w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors";

  // --- Blader handlers ---
  const handleSaveBlader = async () => {
    if (!user || !bladerNome.trim()) { toast.error('Nome é obrigatório'); return; }
    setSavingBlader(true);
    const { error } = await supabase.from('profiles').update({
      nome_blader: bladerNome.trim(),
      cidade_blader: bladerCidade.trim() || null,
      bio_blader: bladerBio.trim() || null,
      beyblade_favorita: bladerBeyblade.trim() || null,
    } as never).eq('id', user.id);
    setSavingBlader(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    await refreshProfiles();
    toast.success('Perfil de Blader atualizado!');
    refreshProfile();
  };

  const handleBladerAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error('Máx 5MB'); return; }
    setBladerAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('blader-avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro ao enviar foto'); setBladerAvatarUploading(false); return; }
    const { data } = supabase.storage.from('blader-avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_blader_url: data.publicUrl } as never).eq('id', user.id);
    setBladerAvatarUploading(false);
    await refreshProfiles();
    toast.success('Foto atualizada!');
    refreshProfile();
  };

  const handleSelectColor = async (key: BladerColorKey) => {
    if (!user || key === localColor) return;
    setSavingColor(key);
    setLocalColor(key);
    const { error } = await supabase.from('profiles').update({ cor_perfil: key } as never).eq('id', user.id);
    setSavingColor(null);
    if (error) { toast.error('Erro ao salvar cor.'); setLocalColor((profile?.corPerfil as BladerColorKey) || 'blue'); return; }
    await refreshProfiles();
    toast.success('Cor atualizada!');
  };

  // --- Org handlers ---
  const handleSaveLiga = async () => {
    if (!formNome.trim()) { toast.error('Nome da liga é obrigatório.'); return; }
    setSavingLiga(true);
    try {
      await updateLiga({ nomeLiga: formNome.trim(), descricao: formDesc.trim(), cidade: formCidade.trim(), endereco: formEndereco.trim() });
      toast.success('Dados da liga atualizados!');
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar.'); }
    setSavingLiga(false);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Máx 2MB'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { toast.error('Use PNG, JPG ou WEBP.'); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile) return;
    setSavingLogo(true);
    try { await uploadLogo(logoFile); setLogoFile(null); setLogoPreview(null); toast.success('Logo atualizado!'); }
    catch (err: any) { toast.error(err.message || 'Erro ao fazer upload.'); }
    setSavingLogo(false);
  };

  const handleRemoveLogo = async () => {
    setSavingLogo(true);
    try { await removeLogo(); setLogoPreview(null); setLogoFile(null); setConfirmRemoveLogo(false); toast.success('Logo removido.'); }
    catch (err: any) { toast.error(err.message || 'Erro ao remover.'); }
    setSavingLogo(false);
  };

  const displayLogo = logoPreview || logoUrl;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-blurple pl-3 flex items-center gap-2">
        <SettingsIcon className="h-7 w-7 text-primary" /> CONFIGURAÇÕES
      </h1>

      {/* ===== BLADER MODE SECTIONS ===== */}
      {isBladerMode && perfis.temBlader && profile && (
        <>
          {/* Blader data */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gold" />
              <h2 className="font-heading text-lg font-bold tracking-wider text-gold">DADOS DO BLADER</h2>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer relative group">
                <div className="h-20 w-20 rounded-full overflow-hidden" style={{ border: '2px solid rgba(245,158,11,.4)' }}>
                  {profile.avatarBladerUrl ? (
                    <img src={profile.avatarBladerUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.04)' }}>
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  {bladerAvatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleBladerAvatarUpload} className="hidden" />
              </label>
              <p className="text-xs text-muted-foreground font-body">Clique para trocar foto do Blader</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body font-medium text-muted-foreground">Nome de Blader *</Label>
              <input type="text" value={bladerNome} onChange={e => setBladerNome(e.target.value)} className={inputClass} placeholder="Seu nome no jogo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body font-medium text-muted-foreground">Cidade</Label>
              <input type="text" value={bladerCidade} onChange={e => setBladerCidade(e.target.value)} className={inputClass} placeholder="São Paulo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body font-medium text-muted-foreground">Beyblade favorita</Label>
              <input type="text" value={bladerBeyblade} onChange={e => setBladerBeyblade(e.target.value)} className={inputClass} placeholder="Dranzer Spiral" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body font-medium text-muted-foreground">Bio ({bladerBio.length}/140)</Label>
              <textarea
                value={bladerBio}
                onChange={e => setBladerBio(e.target.value.slice(0, 140))}
                maxLength={140}
                rows={3}
                className={`${inputClass} h-auto py-2 resize-none`}
                placeholder="Conte um pouco sobre você"
              />
            </div>

            <Button onClick={handleSaveBlader} disabled={savingBlader} className="font-heading tracking-wider gap-2 bg-gold text-background hover:bg-gold/90">
              {savingBlader ? <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar dados do Blader
            </Button>
          </div>

          {/* Color picker */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" style={{ color: BLADER_COLORS[localColor].accent }} />
              <h2 className="font-heading text-lg font-bold tracking-wider" style={{ color: BLADER_COLORS[localColor].accent }}>APARÊNCIA DO PERFIL</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Escolha a cor que representa o seu perfil de Blader.
            </p>
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${BLADER_COLORS[localColor].from}, ${BLADER_COLORS[localColor].to})`, border: `1px solid ${BLADER_COLORS[localColor].border}` }}
            >
              <BladerAvatar url={profile.avatarBladerUrl} name={profile.nomeBlader} colorKey={localColor} size={56} borderWidth={3} style={{ borderColor: 'rgba(255,255,255,.7)' }} />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-white" style={{ fontSize: 16, textShadow: '0 1px 4px rgba(0,0,0,.3)' }}>{profile.nomeBlader || 'Seu nome'}</p>
                <p className="font-body text-white/85" style={{ fontSize: 12 }}>Cor: <span className="font-bold">{BLADER_COLORS[localColor].label}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2 sm:gap-3">
              {BLADER_COLOR_KEYS.map((key) => {
                const palette = BLADER_COLORS[key];
                const selected = localColor === key;
                const saving = savingColor === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectColor(key)}
                    disabled={!!savingColor}
                    aria-label={`Cor ${palette.label}`}
                    className="relative rounded-full transition-transform duration-150 disabled:opacity-60 active:scale-95"
                    style={{
                      width: 40, height: 40,
                      background: getBladerGradient(key),
                      border: selected ? '2px solid #fff' : '2px solid rgba(255,255,255,.08)',
                      boxShadow: selected ? `0 0 0 2px ${palette.accent}, 0 4px 12px ${palette.accent}50` : 'none',
                      cursor: savingColor ? 'wait' : 'pointer',
                      minWidth: 44, minHeight: 44,
                    }}
                  >
                    {selected && !saving && <Check size={18} className="text-white absolute inset-0 m-auto" strokeWidth={3} />}
                    {saving && <div className="absolute inset-0 m-auto h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manage org profile from blader mode */}
          {!perfis.temOrganizador && (
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-bold tracking-wider text-primary">PERFIL DE ORGANIZADOR</h2>
              </div>
              <p className="text-sm text-muted-foreground font-body">Quer criar e gerenciar ligas e torneios?</p>
              <Button onClick={() => navigate('/criar-perfil-organizador')} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Building className="h-4 w-4" /> Criar perfil de Organizador
              </Button>
            </div>
          )}
          {perfis.temOrganizador && (
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-bold tracking-wider text-primary">PERFIL DE ORGANIZADOR</h2>
              </div>
              <p className="text-sm text-muted-foreground font-body">Você tem um perfil de Organizador ativo.</p>
              <Button onClick={() => { setMode('organizador'); navigate('/home'); }} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Building className="h-4 w-4" /> Entrar como Organizador
              </Button>
            </div>
          )}
        </>
      )}

      {/* ===== ORGANIZADOR MODE SECTIONS ===== */}
      {!isBladerMode && (
        <>
          {/* Blader profile management */}
          {!profileLoading && (
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-gold" />
                <h2 className="font-heading text-lg font-bold tracking-wider text-gold">PERFIL DE BLADER</h2>
              </div>
              {perfis.temBlader ? (
                <>
                  <p className="text-sm text-muted-foreground font-body">
                    Você tem um perfil de Blader ativo ({profile.nomeBlader || 'sem nome'}). Troque de modo para editar.
                  </p>
                  <Button onClick={() => { setMode('blader'); navigate('/blader/home'); }} className="font-heading tracking-wider gap-2 bg-gold text-background hover:bg-gold/90">
                    <Zap className="h-4 w-4" /> Entrar como Blader
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-body">
                    Quer participar de torneios e acompanhar seu desempenho? Crie seu perfil de Blader.
                  </p>
                  <Button onClick={() => navigate('/criar-perfil-blader')} className="font-heading tracking-wider gap-2 bg-gold text-background hover:bg-gold/90">
                    <Zap className="h-4 w-4" /> Criar perfil de Blader
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Liga data */}
          <div className="glass-panel p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold tracking-wider text-primary">DADOS DA LIGA</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body font-medium text-muted-foreground">Nome da Liga *</Label>
                <input type="text" value={formNome} onChange={e => setFormNome(e.target.value)} className={inputClass} placeholder="Minha Liga Beyblade" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body font-medium text-muted-foreground">Descrição ({formDesc.length}/280)</Label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value.slice(0, 280))} maxLength={280} rows={3} className={`${inputClass} h-auto py-2 resize-none`} placeholder="Liga oficial..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Cidade</Label>
                  <input type="text" value={formCidade} onChange={e => setFormCidade(e.target.value)} className={inputClass} style={{ height: 44 }} placeholder="São Paulo" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body font-medium text-muted-foreground">Endereço</Label>
                  <input type="text" value={formEndereco} onChange={e => setFormEndereco(e.target.value)} className={inputClass} style={{ height: 44 }} placeholder="Rua, número" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveLiga} disabled={savingLiga} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {savingLiga ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>

          {/* Logo */}
          <div className="glass-panel p-5 space-y-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold tracking-wider text-primary">LOGO</h2>
            </div>
            <p className="text-xs text-muted-foreground font-body">PNG, JPG ou WEBP, máx 2MB.</p>
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border/30 flex items-center justify-center bg-[hsl(var(--surface2))]">
                {displayLogo ? <img src={displayLogo} alt="Logo" className="h-full w-full object-cover" /> : <LigaLogo size={96} />}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoSelect} />
                <Button onClick={() => fileRef.current?.click()} variant="outline" className="font-heading tracking-wider gap-2 border-primary/50 text-primary hover:bg-primary/10">
                  <Upload className="h-4 w-4" /> {logoUrl ? 'Trocar Logo' : 'Upload Logo'}
                </Button>
                {logoFile && (
                  <Button onClick={handleSaveLogo} disabled={savingLogo} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground">
                    {savingLogo ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar logo
                  </Button>
                )}
                {logoUrl && !logoFile && (
                  <Button onClick={() => setConfirmRemoveLogo(true)} variant="outline" className="font-heading tracking-wider gap-2 border-destructive/50 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" /> Remover
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* About — always visible */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold tracking-wider text-primary">SOBRE</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">BladeX — Organizador de Torneios de Beyblade X</p>
        <p className="text-xs text-muted-foreground/60 font-body">Desenvolvido por Augusto Joffer</p>
      </div>

      <ConfirmDialog open={confirmRemoveLogo} onOpenChange={setConfirmRemoveLogo} title="Remover Logo" description="Tem certeza que deseja remover o logo da liga?" confirmLabel="Remover" onConfirm={handleRemoveLogo} />
    </div>
  );
}
