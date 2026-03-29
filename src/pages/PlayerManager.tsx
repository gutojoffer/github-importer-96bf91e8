import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPlayers, savePlayers, deletePlayer } from '@/lib/storage';
import { Player, DEFAULT_AVATARS } from '@/types/tournament';
import PlayerCard from '@/components/PlayerCard';
import { Plus, Trash2, Camera, Link2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function PlayerManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPlayers(getPlayers()); }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomAvatar(reader.result as string);
      setSelectedAvatar('');
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!name.trim()) { toast.error('Nome é obrigatório!'); return; }
    const player: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      nickname: nickname.trim().replace(/^@/, ''),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(),
    };
    const updated = [...players, player];
    savePlayers(updated);
    setPlayers(updated);
    setName(''); setNickname(''); setCustomAvatar(''); setSelectedAvatar(DEFAULT_AVATARS[0]);
    toast.success(`${player.nickname ? `@${player.nickname}` : player.name} cadastrado!`);
  };

  const handleDelete = (id: string) => {
    deletePlayer(id);
    setPlayers(getPlayers());
    toast.success('Jogador removido!');
  };

  const handleGenerateLink = () => {
    const code = Math.random().toString(36).substring(2, 8);
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link Copiado!', {
        description: link,
        duration: 4000,
      });
    }).catch(() => {
      toast.info(link, { description: 'Copie o link acima', duration: 6000 });
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Header with invite link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-primary text-glow-cyan">
          Jogadores
        </h1>
        <Button
          onClick={handleGenerateLink}
          className="font-heading tracking-wide gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
        >
          <Link2 className="h-4 w-4" />
          Gerar Link de Cadastro
          <Copy className="h-3 w-3 opacity-60" />
        </Button>
      </div>

      {/* Add player form */}
      <div className="glass-panel rounded-lg p-5 space-y-4 glow-cyan">
        <h2 className="font-heading text-lg font-bold tracking-wide text-foreground">
          Adicionar Blader
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-heading tracking-wide text-muted-foreground">Nome Completo</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Ex: RODRIGO "DRO" SOUZA'
              className="bg-muted/50 border-border focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-heading tracking-wide text-muted-foreground">Nickname</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="dro_beys"
                className="pl-7 bg-muted/50 border-border focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-heading tracking-wide text-muted-foreground">Foto / Avatar</Label>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => fileRef.current?.click()}
              className={`h-12 w-12 flex items-center justify-center border-2 border-dashed transition-all rounded-full
                ${customAvatar ? 'border-primary glow-cyan' : 'border-border hover:border-primary/50'}`}
            >
              {customAvatar ? (
                <img src={customAvatar} alt="avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <Camera className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <span className="text-muted-foreground text-xs font-body">ou escolha:</span>
            {DEFAULT_AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { setSelectedAvatar(a); setCustomAvatar(''); }}
                className={`h-10 w-10 flex items-center justify-center text-xl rounded-lg border transition-all
                  ${selectedAvatar === a && !customAvatar
                    ? 'border-primary bg-primary/20 glow-cyan'
                    : 'border-border bg-muted/30 hover:border-primary/50'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleAdd} className="font-heading tracking-wide gap-2">
          <Plus className="h-4 w-4" /> Cadastrar
        </Button>
      </div>

      {/* Player list */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-3 tracking-wide text-muted-foreground">
          Bladers Cadastrados ({players.length})
        </h2>
        {players.length === 0 ? (
          <div className="glass-panel rounded-lg text-center py-12">
            <p className="text-muted-foreground text-sm font-body">
              Nenhum blader cadastrado ainda. Adicione acima ou gere um link de convite!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {players.map(p => (
              <div key={p.id} className="relative group animate-slide-in">
                <PlayerCard player={p} />
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-destructive/80 text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
