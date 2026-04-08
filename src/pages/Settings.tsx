import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Upload, Trash2, ImageIcon, Save, Building, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useLiga } from '@/contexts/LigaContext';
import LigaLogo from '@/components/LigaLogo';

export default function Settings() {
  const { nomeLiga, descricao, cidade, endereco, logoUrl, updateLiga, uploadLogo, removeLogo } = useLiga();

  // Liga data form
  const [formNome, setFormNome] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCidade, setFormCidade] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [savingLiga, setSavingLiga] = useState(false);

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Populate form when context loads
  useEffect(() => {
    setFormNome(nomeLiga);
    setFormDesc(descricao);
    setFormCidade(cidade);
    setFormEndereco(endereco);
  }, [nomeLiga, descricao, cidade, endereco]);

  const inputClass = "w-full h-10 px-3 rounded-lg bg-[hsl(var(--surface2))] border border-[rgba(255,255,255,0.07)] text-foreground text-sm font-body focus:outline-none focus:border-primary transition-colors";

  const handleSaveLiga = async () => {
    if (!formNome.trim()) { toast.error('Nome da liga é obrigatório.'); return; }
    setSavingLiga(true);
    try {
      await updateLiga({
        nomeLiga: formNome.trim(),
        descricao: formDesc.trim(),
        cidade: formCidade.trim(),
        endereco: formEndereco.trim(),
      });
      toast.success('Dados da liga atualizados!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar.');
    }
    setSavingLiga(false);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2MB)'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.'); return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile) return;
    setSavingLogo(true);
    try {
      await uploadLogo(logoFile);
      setLogoFile(null);
      setLogoPreview(null);
      toast.success('Logo atualizado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer upload.');
    }
    setSavingLogo(false);
  };

  const handleRemoveLogo = async () => {
    setSavingLogo(true);
    try {
      await removeLogo();
      setLogoPreview(null);
      setLogoFile(null);
      setConfirmRemoveLogo(false);
      toast.success('Logo removido.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover.');
    }
    setSavingLogo(false);
  };

  const displayLogo = logoPreview || logoUrl;

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-blurple pl-3 flex items-center gap-2">
        <SettingsIcon className="h-7 w-7 text-primary" /> CONFIGURAÇÕES
      </h1>

      {/* Section: Dados da Liga */}
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
            <Label className="text-xs font-body font-medium text-muted-foreground">
              Descrição <span className="text-muted-foreground/50">({formDesc.length}/280)</span>
            </Label>
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value.slice(0, 280))}
              maxLength={280}
              rows={3}
              className={`${inputClass} h-auto py-2 resize-none`}
              placeholder="Liga oficial de Beyblade X da região ABC"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-body font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Cidade
              </Label>
              <input type="text" value={formCidade} onChange={e => setFormCidade(e.target.value)} className={inputClass} placeholder="São Paulo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body font-medium text-muted-foreground">Endereço</Label>
              <input type="text" value={formEndereco} onChange={e => setFormEndereco(e.target.value)} className={inputClass} placeholder="Rua, número" />
            </div>
          </div>
        </div>

        <Button onClick={handleSaveLiga} disabled={savingLiga} className="font-heading tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {savingLiga ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>

      {/* Section: Logo */}
      <div className="glass-panel p-5 space-y-5">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold tracking-wider text-primary">LOGO</h2>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          Faça upload do logo da sua liga. Ele aparecerá na sidebar, no VS e no pódio. PNG, JPG ou WEBP, máx 2MB.
        </p>

        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border/30 flex items-center justify-center bg-[hsl(var(--surface2))]">
            {displayLogo ? (
              <img src={displayLogo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <LigaLogo size={96} />
            )}
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

      {/* Section: Conta */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold tracking-wider text-primary">SOBRE</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Arena X — Organizador de Torneios de Beyblade X
        </p>
        <p className="text-xs text-muted-foreground/60 font-body">
          Desenvolvido por Augusto Joffer
        </p>
      </div>

      <ConfirmDialog
        open={confirmRemoveLogo}
        onOpenChange={setConfirmRemoveLogo}
        title="Remover Logo"
        description="Tem certeza que deseja remover o logo da liga?"
        confirmLabel="Remover"
        onConfirm={handleRemoveLogo}
      />
    </div>
  );
}
