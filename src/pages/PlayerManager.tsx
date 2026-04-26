import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { Player, DEFAULT_AVATARS } from '@/types/tournament';
import PlayerCard from '@/components/PlayerCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Trash2, Camera, Users, Pencil, X, Check, UserPlus2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BladerTemp {
  id: string;
  organizador_id: string;
  nome: string;
  apelido: string | null;
  email: string | null;
  cidade: string | null;
  telefone: string | null;
  beyblade_favorita: string | null;
  avatar_url: string | null;
  vinculado_a: string | null;
  vinculado_em: string | null;
  created_at: string;
}

export default function PlayerManager() {
  const { user } = useAuth();
  const { players, load, add, remove, update } = usePlayerStore();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNick, setEditNick] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCustomAvatar, setEditCustomAvatar] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  // ====== bladers_temp ======
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  const [tempForm, setTempForm] = useState<Partial<BladerTemp>>({});
  const [deleteTempTarget, setDeleteTempTarget] = useState<BladerTemp | null>(null);

  const { data: bladersTemp = [], refetch: refetchTemp, isLoading: loadingTemp } = useQuery({
    queryKey: ['bladers-temp-organizador', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bladers_temp')
        .select('id, organizador_id, nome, apelido, email, cidade, telefone, beyblade_favorita, avatar_url, vinculado_a, vinculado_em, created_at')
        .eq('organizador_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[PlayerManager] bladers_temp', error);
        return [];
      }
      return (data ?? []) as BladerTemp[];
    },
    enabled: !!user,
  });

  useEffect(() => { load(); }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCustomAvatar(reader.result as string); setSelectedAvatar(''); };
    reader.readAsDataURL(file);
  }, []);

  const handleAdd = useCallback(() => {
    if (!name.trim()) { toast.error('Nome é obrigatório!'); return; }
    const player: Player = {
      id: crypto.randomUUID(), name: name.trim(),
      nickname: nickname.trim().replace(/^@/, ''),
      avatar: customAvatar || selectedAvatar,
      createdAt: new Date().toISOString(), xp: 0,
    };
    add(player);
    setName(''); setNickname(''); setCustomAvatar(''); setSelectedAvatar(DEFAULT_AVATARS[0]);
    toast.success(`${player.nickname ? `@${player.nickname}` : player.name} cadastrado!`);
  }, [name, nickname, customAvatar, selectedAvatar, add]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    remove(deleteTarget.id);
    setDeleteTarget(null);
    toast.success('Jogador removido!');
  }, [deleteTarget, remove]);

  const startEdit = useCallback((p: Player) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditNick(p.nickname || '');
    setEditAvatar(p.avatar);
    setEditCustomAvatar(p.avatar.startsWith('data:') || p.avatar.startsWith('http') ? p.avatar : '');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId || !editName.trim()) { toast.error('Nome obrigatório!'); return; }
    await update(editingId, {
      name: editName.trim(),
      nickname: editNick.trim().replace(/^@/, ''),
      avatar: editCustomAvatar || editAvatar,
    });
    setEditingId(null);
    toast.success('Blader atualizado!');
  }, [editingId, editName, editNick, editAvatar, editCustomAvatar, update]);

  // ====== bladers_temp handlers ======
  function startTempEdit(b: BladerTemp) {
    setEditingTempId(b.id);
    setTempForm({
      nome: b.nome,
      apelido: b.apelido || '',
      email: b.email || '',
      cidade: b.cidade || '',
      telefone: b.telefone || '',
      beyblade_favorita: b.beyblade_favorita || '',
    });
  }

  async function saveTempEdit() {
    if (!editingTempId) return;
    if (!tempForm.nome?.trim()) { toast.error('Nome obrigatório'); return; }
    const payload = {
      nome: tempForm.nome.trim(),
      apelido: (tempForm.apelido || '').trim() || null,
      email: (tempForm.email || '').trim().toLowerCase() || null,
      cidade: (tempForm.cidade || '').trim() || null,
      telefone: (tempForm.telefone || '').trim() || null,
      beyblade_favorita: (tempForm.beyblade_favorita || '').trim() || null,
    };
    const { error } = await supabase.from('bladers_temp').update(payload).eq('id', editingTempId);
    if (error) { toast.error('Erro ao salvar'); console.error(error); return; }
    toast.success('Blader temporário atualizado');
    setEditingTempId(null);
    refetchTemp();
  }

  async function confirmDeleteTemp() {
    if (!deleteTempTarget) return;
    const { error } = await supabase.from('bladers_temp').delete().eq('id', deleteTempTarget.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Removido');
    setDeleteTempTarget(null);
    refetchTemp();
  }

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-6 relative">
      
      <h1 className="font-heading text-3xl font-bold tracking-wider text-foreground italic neon-line-blurple pl-3 flex items-center gap-2">
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
                {editingId === p.id ? (
                  <div className="glass-panel p-3 space-y-2 border-primary/50">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" className="bg-muted/30 border-border h-8 text-sm" />
                    <Input value={editNick} onChange={e => setEditNick(e.target.value)} placeholder="@nick" className="bg-muted/30 border-border h-8 text-sm" />
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <button onClick={() => editFileRef.current?.click()} className={`h-8 w-8 rounded-full border border-dashed flex items-center justify-center shrink-0 ${editCustomAvatar ? 'border-primary' : 'border-muted'}`}>
                        {editCustomAvatar ? <img src={editCustomAvatar} className="h-full w-full rounded-full object-cover" /> : <Camera className="h-3 w-3 text-muted-foreground" />}
                      </button>
                      <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setEditCustomAvatar(r.result as string); setEditAvatar(''); }; r.readAsDataURL(f); } }} />
                      {DEFAULT_AVATARS.slice(0, 6).map(a => (
                        <button key={a} onClick={() => { setEditAvatar(a); setEditCustomAvatar(''); }}
                          className={`h-6 w-6 text-xs rounded border ${editAvatar === a && !editCustomAvatar ? 'border-primary bg-primary/10' : 'border-muted'}`}>{a}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="flex-1 gap-1 font-heading h-7 bg-primary text-primary-foreground"><Check className="h-3 w-3" /> Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="font-heading h-7"><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <PlayerCard player={p} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => startEdit(p)} className="p-1.5 bg-primary/80 text-primary-foreground rounded-lg">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 bg-destructive/80 text-destructive-foreground rounded-lg">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== Bladers temporários (cadastrados em torneios) ====== */}
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="font-heading text-xl font-bold tracking-wider text-muted-foreground flex items-center gap-2">
            <UserPlus2 className="h-5 w-5" /> BLADERS TEMPORÁRIOS ({bladersTemp.length})
          </h2>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-3">
          Bladers que você cadastrou rapidamente em torneios. Adicione um e-mail para que eles possam vincular a conta ao se cadastrarem na plataforma.
        </p>

        {loadingTemp ? (
          <div className="glass-panel p-6 text-center text-sm text-muted-foreground font-body">Carregando…</div>
        ) : bladersTemp.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <UserPlus2 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm font-body">Nenhum blader temporário cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bladersTemp.map(b => {
              const editing = editingTempId === b.id;
              return (
                <div key={b.id} className="glass-panel p-3" style={{ borderColor: editing ? 'rgba(245,158,11,.4)' : undefined }}>
                  {editing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input value={tempForm.nome || ''} onChange={e => setTempForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" className="bg-muted/30 border-border h-9 text-sm" />
                        <Input value={tempForm.apelido || ''} onChange={e => setTempForm(f => ({ ...f, apelido: e.target.value }))} placeholder="Apelido" className="bg-muted/30 border-border h-9 text-sm" />
                        <Input value={tempForm.email || ''} onChange={e => setTempForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" type="email" className="bg-muted/30 border-border h-9 text-sm" />
                        <Input value={tempForm.telefone || ''} onChange={e => setTempForm(f => ({ ...f, telefone: e.target.value }))} placeholder="Telefone" className="bg-muted/30 border-border h-9 text-sm" />
                        <Input value={tempForm.cidade || ''} onChange={e => setTempForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Cidade" className="bg-muted/30 border-border h-9 text-sm" />
                        <Input value={tempForm.beyblade_favorita || ''} onChange={e => setTempForm(f => ({ ...f, beyblade_favorita: e.target.value }))} placeholder="Beyblade favorita" className="bg-muted/30 border-border h-9 text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveTempEdit} className="gap-1 font-heading h-8 bg-primary text-primary-foreground"><Check className="h-3 w-3" /> Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTempId(null)} className="font-heading h-8"><X className="h-3 w-3" /> Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0 overflow-hidden">
                        {b.avatar_url ? <img src={b.avatar_url} alt="" className="h-full w-full object-cover" /> : (b.nome[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading text-sm text-foreground truncate">{b.nome}</span>
                          {b.apelido && <span className="text-xs text-muted-foreground font-body">@{b.apelido}</span>}
                          {b.vinculado_a ? (
                            <span style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#34D399', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>VINCULADO ✓</span>
                          ) : (
                            <span style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#FCD34D', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>SEM CONTA</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-body flex-wrap">
                          {b.email ? (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{b.email}</span>
                          ) : (
                            <span className="italic" style={{ color: '#F59E0B' }}>sem e-mail — adicione para permitir vínculo</span>
                          )}
                          {b.cidade && <span>· {b.cidade}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!b.vinculado_a && (
                          <button onClick={() => startTempEdit(b)} className="p-1.5 bg-primary/80 text-primary-foreground rounded-lg" title="Editar">
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        <button onClick={() => setDeleteTempTarget(b)} className="p-1.5 bg-destructive/80 text-destructive-foreground rounded-lg" title="Excluir">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Excluir Blader"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!deleteTempTarget}
        onOpenChange={(open) => { if (!open) setDeleteTempTarget(null); }}
        title="Excluir blader temporário"
        description={`Remover "${deleteTempTarget?.nome}"? Histórico de inscrições deste blader será mantido sem dono.`}
        confirmLabel="Excluir"
        onConfirm={confirmDeleteTemp}
      />
    </div>
  );
}
