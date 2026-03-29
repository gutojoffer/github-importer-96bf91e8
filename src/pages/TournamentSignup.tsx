import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTournaments, getPlayers, savePlayers, registerPlayerToTournament } from '@/lib/storage';
import { Player, DEFAULT_AVATARS, Tournament } from '@/types/tournament';
import { Camera, UserPlus, CheckCircle, Swords } from 'lucide-react';

export default function TournamentSignup() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [registered, setRegistered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const all = getTournaments();
    const found = all.find(t => t.id === tournamentId);
    if (found) setTournament(found);
  }, [tournamentId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCustomAvatar(reader.result as string); setSelectedAvatar(''); };
    reader.readAsDataURL(file);
  };

  const handleRegister = () => {
    if (!name.trim() || !tournament) return;
    const player: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      nickname: nickname.trim().replace(/^@/, ''),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(),
      xp: 0,
    };
    const all = getPlayers();
    all.push(player);
    savePlayers(all);
    registerPlayerToTournament(tournament.id, player.id);
    setRegistered(true);
  };

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="dark-panel p-10 text-center max-w-md w-full">
          <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-body">Torneio não encontrado.</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="dark-panel p-10 text-center max-w-md w-full anim-fade-up">
          <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground italic">INSCRIÇÃO CONFIRMADA!</h1>
          <p className="text-muted-foreground font-body text-sm mt-2">
            Você está inscrito no <strong>{tournament.name}</strong>. Prepare-se para batalhar!
          </p>
          <Button onClick={() => navigate('/')} className="mt-6 font-heading tracking-wider">
            Voltar ao Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="dark-panel p-8 max-w-md w-full border-l-4 border-primary">
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-foreground italic">INSCRIÇÃO</h1>
          <p className="text-primary font-heading text-sm font-bold mt-1">{tournament.name}</p>
        </div>

        <div className="space-y-5">
          <div className="flex justify-center">
            <button
              onClick={() => fileRef.current?.click()}
              className={`h-24 w-24 flex items-center justify-center rounded-full border-2 border-dashed transition-all
                ${customAvatar ? 'border-primary' : 'border-muted hover:border-primary/50'}`}
            >
              {customAvatar ? (
                <img src={customAvatar} alt="avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          {!customAvatar && (
            <div className="flex flex-wrap justify-center gap-2">
              {DEFAULT_AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedAvatar(a)}
                  className={`h-10 w-10 flex items-center justify-center text-xl border transition-all
                    ${selectedAvatar === a ? 'border-primary bg-primary/10' : 'border-muted bg-card hover:border-primary/30'}`}
                >
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

          <Button
            onClick={handleRegister}
            disabled={!name.trim()}
            className="w-full font-heading tracking-wider text-lg gap-2 h-12 bg-primary text-primary-foreground hover:bg-primary/80"
          >
            <UserPlus className="h-5 w-5" /> REGISTRAR BLADER
          </Button>
        </div>
      </div>
    </div>
  );
}
