import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Upload, Trash2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

const LOGO_KEY = 'bhx_custom_logo';

export function getCustomLogo(): string | null {
  try { return localStorage.getItem(LOGO_KEY); } catch { return null; }
}

export default function Settings() {
  const [logo, setLogo] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLogo(getCustomLogo()); }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { toast.error('Imagem muito grande (máx 500KB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      localStorage.setItem(LOGO_KEY, data);
      setLogo(data);
      toast.success('Logo atualizado!');
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    localStorage.removeItem(LOGO_KEY);
    setLogo(null);
    setConfirmClear(false);
    toast.success('Logo removido.');
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-blurple pl-3 flex items-center gap-2">
        <SettingsIcon className="h-7 w-7 text-primary" /> CONFIGURAÇÕES
      </h1>

      <div className="glass-panel p-5 space-y-5">
        <h2 className="font-heading text-lg font-bold tracking-wider text-primary">LOGO PERSONALIZADO</h2>
        <p className="text-xs text-muted-foreground font-body">
          Faça upload do logo da sua loja. Ele aparecerá no header e na tela de Versus. Máximo 500KB.
        </p>

        <div className="flex items-center gap-6">
          <div className="h-24 w-24 glass-panel flex items-center justify-center rounded-xl overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-contain p-2" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} variant="outline" className="font-heading tracking-wider gap-2 border-primary/50 text-primary hover:bg-primary/10">
              <Upload className="h-4 w-4" /> Upload Logo
            </Button>
            {logo && (
              <Button onClick={() => setConfirmClear(true)} variant="outline" className="font-heading tracking-wider gap-2 border-destructive/50 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-3">
        <h2 className="font-heading text-lg font-bold tracking-wider text-primary">SOBRE</h2>
        <p className="text-sm text-muted-foreground font-body">
          Blader Hub X — Sistema de Gerenciamento de Torneios de Beyblade X
        </p>
        <p className="text-xs text-muted-foreground/60 font-body">
          Desenvolvido por Augusto Joffer
        </p>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Remover Logo"
        description="Tem certeza que deseja remover o logo personalizado?"
        confirmLabel="Remover"
        onConfirm={handleClearLogo}
      />
    </div>
  );
}
