import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPlayer } from '@/lib/storage';
import { Player, DEFAULT_AVATARS } from '@/types/tournament';
import { Camera, UserPlus, CheckCircle } from 'lucide-react';

export default function PlayerRegister() {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [registered, setRegistered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCustomAvatar(reader.result as string); setSelectedAvatar(''); };
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!name.trim()) return;
    const player: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      nickname: nickname.trim().replace(/^@/, ''),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(),
      xp: 0,
    };
    await addPlayer(player);
    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="dark-panel p-10 text-center max-w-md w-full anim-fade-up">
          <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Registro Completo!</h1>
          <p className="text-muted-foreground font-body text-sm">Seu perfil de Blader foi cadastrado com sucesso. Aguarde o início do torneio!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="dark-panel p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-foreground mb-1">BLADER HUB X</h1>
          <p className="text-muted-foreground font-body text-sm">Registro de Blader</p>
        </div>
        <div className="space-y-5">
          <div className="flex justify-center">
            <button onClick={() => fileRef.current?.click()}
              className={`h-24 w-24 flex items-center justify-center rounded-full border-2 border-dashed transition-all ${customAvatar ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
              {customAvatar ? <img src={customAvatar} alt="avatar" className="h-full w-full rounded-full object-cover" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
          {!customAvatar && (
            <div className="flex flex-wrap justify-center gap-2">
              {DEFAULT_AVATARS.map(a => (
                <button key={a} onClick={() => setSelectedAvatar(a)}
                  className={`h-10 w-10 flex items-center justify-center text-xl rounded-full border-2 transition-all ${selectedAvatar === a ? 'border-primary bg-primary/15' : 'border-border bg-background hover:border-primary/40'}`}>
                  {a}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label className="font-heading tracking-wide text-muted-foreground">Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="bg-muted/30 border-border" />
          </div>
          <div className="space-y-2">
            <Label className="font-heading tracking-wide text-muted-foreground">Nickname</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="seu_nick" className="pl-7 bg-muted/30 border-border" />
            </div>
          </div>
          <Button onClick={handleRegister} disabled={!name.trim()} className="w-full font-heading tracking-wider text-lg gap-2 h-12 bg-primary text-primary-foreground hover:bg-primary/80">
            <UserPlus className="h-5 w-5" /> REGISTRAR BLADER
          </Button>
        </div>
      </div>
    </div>
  );
}
