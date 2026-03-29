import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPlayers, savePlayers, deletePlayer } from '@/lib/storage';
import { Player, DEFAULT_AVATARS } from '@/types/tournament';
import PlayerCard from '@/components/PlayerCard';
import { Plus, Trash2, Camera } from 'lucide-react';
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
      nickname: nickname.trim(),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(),
    };
    const updated = [...players, player];
    savePlayers(updated);
    setPlayers(updated);
    setName(''); setNickname(''); setCustomAvatar(''); setSelectedAvatar(DEFAULT_AVATARS[0]);
    toast.success(`${player.nickname || player.name} cadastrado!`);
  };

  const handleDelete = (id: string) => {
    deletePlayer(id);
    setPlayers(getPlayers());
    toast.success('Jogador removido!');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">Cadastrar Jogador</h1>

      {/* Form */}
      <div className="border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-heading tracking-wide">Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label className="font-heading tracking-wide">Nickname</Label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Apelido de batalha" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-heading tracking-wide">Avatar</Label>
          <div className="flex flex-wrap gap-2 items-center">
            {DEFAULT_AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { setSelectedAvatar(a); setCustomAvatar(''); }}
                className={`h-10 w-10 flex items-center justify-center text-xl border transition-all
                  ${selectedAvatar === a && !customAvatar ? 'border-primary bg-primary/20' : 'border-border bg-card hover:border-primary/50'}`}
              >
                {a}
              </button>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className={`h-10 w-10 flex items-center justify-center border transition-all
                ${customAvatar ? 'border-primary bg-primary/20' : 'border-border bg-card hover:border-primary/50'}`}
            >
              <Camera className="h-4 w-4 text-muted-foreground" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        <Button onClick={handleAdd} className="font-heading tracking-wide gap-2">
          <Plus className="h-4 w-4" /> Cadastrar
        </Button>
      </div>

      {/* Player List */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-3 tracking-wide">
          Jogadores Cadastrados ({players.length})
        </h2>
        {players.length === 0 ? (
          <p className="text-muted-foreground text-sm font-body text-center py-8">Nenhum jogador cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {players.map(p => (
              <div key={p.id} className="relative group">
                <PlayerCard player={p} />
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-destructive/80 text-destructive-foreground"
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
