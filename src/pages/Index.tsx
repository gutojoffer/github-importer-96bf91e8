import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useTournamentStore } from '@/stores/useTournamentStore';
import { Tournament, Player, DEFAULT_AVATARS } from '@/types/tournament';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EloBadge from '@/components/EloBadge';
import { Trophy, Calendar, Users, ChevronRight, X, Search, UserPlus, Check, Camera, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const players = usePlayerStore(s => s.players);
  const loadPlayers = usePlayerStore(s => s.load);
  const addPlayerToStore = usePlayerStore(s => s.add);
  const { tournaments, load: loadTournaments, enrollPlayer } = useTournamentStore();

  // Smart Registration Modal
  const [signupModal, setSignupModal] = useState<string | null>(null);
  const [signupTab, setSignupTab] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newNick, setNewNick] = useState('');
  const [newAvatar, setNewAvatar] = useState(DEFAULT_AVATARS[0]);
  const [newCustomAvatar, setNewCustomAvatar] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPlayers();
    loadTournaments();
  }, []);

  const upcoming = useMemo(() => tournaments.filter(t => t.status === 'upcoming'), [tournaments]);

  const signupTournament = useMemo(() =>
    signupModal ? tournaments.find(t => t.id === signupModal) : null
  , [signupModal, tournaments]);

  const filteredPlayers = useMemo(() =>
    players.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  , [players, searchQuery]);

  const handleSelectPlayer = useCallback((playerId: string) => {
    if (!signupModal || !signupTournament) return;
    if (signupTournament.playerIds.includes(playerId)) {
      toast.info('Jogador já inscrito!');
      return;
    }
    enrollPlayer(signupModal, playerId);
    toast.success('Inscrito com sucesso!');
  }, [signupModal, signupTournament, enrollPlayer]);

  const handleNewRegister = useCallback(() => {
    if (!newName.trim() || !signupModal) { toast.error('Nome obrigatório!'); return; }
    const player: Player = {
      id: crypto.randomUUID(), name: newName.trim(),
      nickname: newNick.trim().replace(/^@/, ''),
      avatar: newCustomAvatar || newAvatar,
      createdAt: new Date().toISOString(), xp: 0,
    };
    addPlayerToStore(player);
    enrollPlayer(signupModal, player.id);
    setNewName(''); setNewNick(''); setNewCustomAvatar(''); setNewAvatar(DEFAULT_AVATARS[0]);
    setSignupTab('existing');
    toast.success(`${player.name} cadastrado e inscrito!`);
  }, [newName, newNick, newCustomAvatar, newAvatar, signupModal, addPlayerToStore, enrollPlayer]);

  const closeModal = useCallback(() => {
    setSignupModal(null);
    setSignupTab('existing');
    setSearchQuery('');
  }, []);

  return (
    <div className="min-h-screen relative">
      
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/3 to-transparent" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Trophy className="h-12 w-12 text-primary" />
              <div className="absolute -inset-2 bg-primary/10 rounded-full blur-md anim-glow-pulse" />
            </div>
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-[0.15em] text-foreground italic">BLADER HUB X</h1>
          <p className="font-heading text-sm text-muted-foreground tracking-[0.3em] mt-2 uppercase">Tournament Management System</p>
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        <h2 className="font-heading text-2xl font-bold tracking-wider text-foreground flex items-center gap-2 neon-line-cyan pl-3">PRÓXIMOS TORNEIOS</h2>
        {upcoming.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-body text-sm">Nenhum torneio agendado no momento.</p>
            <p className="text-muted-foreground font-body text-xs mt-1">Organizadores podem criar torneios na aba Torneio.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((t, i) => {
              const registeredPlayers = t.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
              const spotsLeft = (t.maxPlayers || 32) - t.playerIds.length;
              return (
                <div key={t.id} className="glass-panel p-0 overflow-hidden anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="neon-line-cyan p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl font-bold text-foreground italic tracking-wide">{t.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-body">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.playerIds.length} / {t.maxPlayers || 32} inscritos</span>
                        </div>
                        {registeredPlayers.length > 0 && (
                          <div className="flex items-center mt-3 -space-x-2">
                            {registeredPlayers.slice(0, 6).map(p => (
                              <Avatar key={p.id} className="h-7 w-7 border-2 border-card">
                                {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} alt={p.name} /> : <AvatarFallback className="bg-muted text-[10px]">{p.avatar}</AvatarFallback>}
                              </Avatar>
                            ))}
                            {registeredPlayers.length > 6 && <span className="text-[10px] text-muted-foreground ml-3 font-heading">+{registeredPlayers.length - 6}</span>}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => setSignupModal(t.id)}
                        className="font-heading tracking-wider gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 h-12 px-6"
                        disabled={spotsLeft <= 0}
                      >
                        {spotsLeft > 0 ? 'INSCREVER-SE' : 'LOTADO'}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {spotsLeft > 0 && spotsLeft <= 5 && (
                      <p className="text-[10px] text-secondary font-heading mt-2 tracking-wider">⚠ APENAS {spotsLeft} VAGA{spotsLeft > 1 ? 'S' : ''} RESTANTE{spotsLeft > 1 ? 'S' : ''}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Smart Registration Modal */}
      {signupTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10 glass-panel p-6 max-w-lg w-full max-h-[85vh] overflow-auto glow-cyan" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-primary tracking-wider">INSCRIÇÃO</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/30">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-body mb-4">{signupTournament.name}</p>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-muted/30 rounded-lg p-1">
              <button
                onClick={() => setSignupTab('existing')}
                className={`flex-1 font-heading text-xs tracking-wider py-2 rounded-md transition-all ${signupTab === 'existing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                BLADERS CADASTRADOS
              </button>
              <button
                onClick={() => setSignupTab('new')}
                className={`flex-1 font-heading text-xs tracking-wider py-2 rounded-md transition-all ${signupTab === 'new' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                NOVO CADASTRO
              </button>
            </div>

            {signupTab === 'existing' ? (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar blader..." className="pl-9 bg-muted/30 border-border h-9" />
                </div>
                <div className="space-y-1.5 max-h-[40vh] overflow-auto">
                  {filteredPlayers.map(p => {
                    const enrolled = signupTournament.playerIds.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => handleSelectPlayer(p.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${enrolled ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30 border border-transparent'}`}>
                        <Avatar className="h-9 w-9 border border-muted">
                          {p.avatar.startsWith('http') || p.avatar.startsWith('data:') ? <AvatarImage src={p.avatar} /> : <AvatarFallback className="bg-muted text-sm">{p.avatar}</AvatarFallback>}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm text-foreground truncate">{p.name}</p>
                          {p.nickname && <p className="text-[10px] text-muted-foreground">@{p.nickname}</p>}
                        </div>
                        <EloBadge xp={p.xp || 0} size="sm" />
                        {enrolled ? (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-muted shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {filteredPlayers.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">Nenhum blader encontrado.</p>
                      <Button variant="link" onClick={() => setSignupTab('new')} className="font-heading text-secondary mt-1">
                        Cadastrar novo blader →
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button onClick={() => fileRef.current?.click()}
                    className={`h-20 w-20 flex items-center justify-center rounded-full border-2 border-dashed transition-all ${newCustomAvatar ? 'border-primary' : 'border-muted hover:border-primary/50'}`}>
                    {newCustomAvatar ? <img src={newCustomAvatar} className="h-full w-full rounded-full object-cover" /> : <Camera className="h-7 w-7 text-muted-foreground" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setNewCustomAvatar(r.result as string); setNewAvatar(''); }; r.readAsDataURL(f); } }} />
                </div>
                {!newCustomAvatar && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {DEFAULT_AVATARS.map(a => (
                      <button key={a} onClick={() => setNewAvatar(a)}
                        className={`h-9 w-9 flex items-center justify-center text-lg border transition-all rounded-lg ${newAvatar === a ? 'border-primary bg-primary/10' : 'border-muted bg-card hover:border-primary/30'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="font-heading tracking-wide text-muted-foreground text-xs">Nome</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" className="bg-muted/30 border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading tracking-wide text-muted-foreground text-xs">Nickname</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input value={newNick} onChange={e => setNewNick(e.target.value)} placeholder="seu_nick" className="pl-7 bg-muted/30 border-border" />
                  </div>
                </div>
                <Button onClick={handleNewRegister} disabled={!newName.trim()} className="w-full font-heading tracking-wider text-lg gap-2 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  <UserPlus className="h-5 w-5" /> CADASTRAR E INSCREVER
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
