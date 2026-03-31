import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPlayers, addPlayer, deletePlayer } from '@/lib/storage';
import { Player, DEFAULT_AVATARS } from '@/types/tournament';
import PlayerCard from '@/components/PlayerCard';
import { Plus, Trash2, Camera, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function PlayerManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCustomAvatar(reader.result as string); setSelectedAvatar(''); };
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Nome é obrigatório!'); return; }
    const player: Player = {
      id: crypto.randomUUID(), name: name.trim(),
      nickname: nickname.trim().replace(/^@/, ''),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(), xp: 0,
    };
    await addPlayer(player);
    setPlayers(await getPlayers());
    setName(''); setNickname(''); setCustomAvatar(''); setSelectedAvatar(DEFAULT_AVATARS[0]);
    toast.success(`${player.nickname ? `@${player.nickname}` : player.name} cadastrado!`);
  };

  const handleDelete = async (id: string) => {
    await deletePlayer(id);
    setPlayers(await getPlayers());
    toast.success('Jogador removido!');
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-cyan pl-3 flex items-center gap-2">
        <Users className="h-7 w-7 text-primary" /> BLADERS
      </h1>

      <div className="glass-panel p-5 space-y-4 neon-line-magenta">
        <h2 className="font-heading text-lg font-bold tracking-wider text-secondary">ADICIONAR BLADER</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-heading text-muted-foreground text-xs">Nome Completo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder='Ex: RODRIGO "DRO" SOUZA' className="bg-muted/30 border-border" />
          </div>
          <div className="space-y-2">
            <Label className="font-heading text-muted-foreground text-xs">Nickname</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="dro_beys" className="pl-7 bg-muted/30 border-border" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-heading text-muted-foreground text-xs">Foto / Avatar</Label>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => fileRef.current?.click()}
              className={`h-14 w-14 flex items-center justify-center border-2 border-dashed transition-all rounded-full ${customAvatar ? 'border-primary' : 'border-muted hover:border-primary/50'}`}>
              {customAvatar ? <img src={customAvatar} alt="avatar" className="h-full w-full rounded-full object-cover" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <span className="text-muted-foreground text-xs font-body">ou:</span>
            {DEFAULT_AVATARS.map(a => (
              <button key={a} onClick={() => { setSelectedAvatar(a); setCustomAvatar(''); }}
                className={`h-9 w-9 flex items-center justify-center text-lg border transition-all rounded-lg ${selectedAvatar === a && !customAvatar ? 'border-primary bg-primary/10' : 'border-muted bg-card hover:border-primary/30'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleAdd} className="font-heading tracking-wider gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Plus className="h-4 w-4" /> Cadastrar
        </Button>
      </div>

      <div>
        <h2 className="font-heading text-xl font-bold mb-3 tracking-wider text-muted-foreground">CADASTRADOS ({players.length})</h2>
        {players.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-body">Nenhum blader cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {players.map(p => (
              <div key={p.id} className="relative group">
                <PlayerCard player={p} />
                <button onClick={() => handleDelete(p.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-destructive/80 text-destructive-foreground rounded-lg">
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
