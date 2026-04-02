import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { Player, DEFAULT_AVATARS } from '@/types/tournament';
import EloBadge from '@/components/EloBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, UserPlus, CheckCircle, Trophy, Search, X, Check } from 'lucide-react';

export default function TournamentSignup() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const addPlayerToStore = usePlayerStore(s => s.add);
  const { tournaments, load: loadTournaments, enrollPlayer } = useTournamentStore();

  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPlayers(); loadTournaments(); }, []);

  const tournament = useMemo(() =>
    tournaments.find(t => t.id === tournamentId)
  , [tournaments, tournamentId]);

  const filteredPlayers = useMemo(() =>
    players.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  , [players, searchQuery]);

  const handleSelectPlayer = useCallback((player: Player) => {
    if (!tournament) return;
    if (tournament.playerIds.includes(player.id)) return;
    enrollPlayer(tournament.id, player.id);
    setRegisteredName(player.nickname ? `@${player.nickname}` : player.name);
    setRegistered(true);
  }, [tournament, enrollPlayer]);

  const handleNewRegister = useCallback(() => {
    if (!name.trim() || !tournament) return;
    const player: Player = {
      id: crypto.randomUUID(), name: name.trim(),
      nickname: nickname.trim().replace(/^@/, ''),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(), xp: 0,
    };
    addPlayerToStore(player);
    enrollPlayer(tournament.id, player.id);
    setRegisteredName(player.nickname ? `@${player.nickname}` : player.name);
    setRegistered(true);
  }, [name, nickname, customAvatar, selectedAvatar, tournament, addPlayerToStore, enrollPlayer]);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="glass-panel p-10 text-center max-w-md w-full">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-body">Torneio não encontrado.</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="glass-panel p-10 text-center max-w-md w-full anim-fade-up glow-cyan">
          <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground italic">INSCRIÇÃO CONFIRMADA!</h1>
          <p className="text-muted-foreground font-body text-sm mt-2">
            <strong className="text-primary">{registeredName}</strong> está inscrito no <strong className="text-primary">{tournament.name}</strong>. Prepare-se!
          </p>
          <Button onClick={() => navigate('/')} className="mt-6 font-heading tracking-wider bg-primary text-primary-foreground">Voltar ao Hub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass-panel p-6 max-w-md w-full neon-line-cyan glow-cyan">
        <div className="text-center mb-5">
          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-foreground italic">INSCRIÇÃO</h1>
          <p className="text-primary font-heading text-sm font-bold mt-1">{tournament.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-muted/30 rounded-lg p-1">
          <button onClick={() => setTab('existing')}
            className={`flex-1 font-heading text-xs tracking-wider py-2 rounded-md transition-all ${tab === 'existing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            JÁ CADASTRADO
          </button>
          <button onClick={() => setTab('new')}
            className={`flex-1 font-heading text-xs tracking-wider py-2 rounded-md transition-all ${tab === 'new' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            NOVO CADASTRO
          </button>
        </div>

        {tab === 'existing' ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar seu nome..." className="pl-9 bg-muted/30 border-border h-9" />
            </div>
            <div className="space-y-1.5 max-h-[50vh] overflow-auto">
              {filteredPlayers.map(p => {
                const enrolled = tournament.playerIds.includes(p.id);
                return (
                  <button key={p.id} onClick={() => handleSelectPlayer(p)} disabled={enrolled}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${enrolled ? 'bg-primary/10 border border-primary/30 opacity-60' : 'hover:bg-muted/30 border border-transparent'}`}>
                    <Avatar className="h-9 w-9 border border-muted">
                      {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} /> : <AvatarFallback className="bg-muted text-sm">{p.avatar}</AvatarFallback>}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-foreground truncate">{p.name}</p>
                      {p.nickname && <p className="text-[10px] text-muted-foreground">@{p.nickname}</p>}
                    </div>
                    <EloBadge xp={p.xp || 0} size="sm" />
                    {enrolled && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">Nenhum blader encontrado.</p>
                  <Button variant="link" onClick={() => setTab('new')} className="font-heading text-secondary mt-1">
                    Fazer novo cadastro →
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-center">
              <button onClick={() => fileRef.current?.click()}
                className={`h-24 w-24 flex items-center justify-center rounded-full border-2 border-dashed transition-all ${customAvatar ? 'border-primary' : 'border-muted hover:border-primary/50'}`}>
                {customAvatar ? <img src={customAvatar} alt="avatar" className="h-full w-full rounded-full object-cover" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setCustomAvatar(r.result as string); setSelectedAvatar(''); }; r.readAsDataURL(f); } }} />
            </div>
            {!customAvatar && (
              <div className="flex flex-wrap justify-center gap-2">
                {DEFAULT_AVATARS.map(a => (
                  <button key={a} onClick={() => setSelectedAvatar(a)}
                    className={`h-10 w-10 flex items-center justify-center text-xl border transition-all rounded-lg ${selectedAvatar === a ? 'border-primary bg-primary/10' : 'border-muted bg-card hover:border-primary/30'}`}>
                    {a}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-heading tracking-wide text-muted-foreground text-xs">Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading tracking-wide text-muted-foreground text-xs">Nickname</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="seu_nick" className="pl-7 bg-muted/30 border-border" />
              </div>
            </div>
            <Button onClick={handleNewRegister} disabled={!name.trim()} className="w-full font-heading tracking-wider text-lg gap-2 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <UserPlus className="h-5 w-5" /> REGISTRAR BLADER
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
