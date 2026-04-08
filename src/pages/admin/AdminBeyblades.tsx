import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Disc3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SkeletonBox from '@/components/SkeletonBox';
import ConfirmDialog from '@/components/ConfirmDialog';

type Beyblade = {
  id: string;
  nome: string;
  ratchet: string;
  bit: string;
  tier: string;
  tipo: string;
  descricao: string | null;
  imagem_url: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
};

const TIERS = ['S', 'A', 'B', 'C'] as const;
const TIPOS = ['Attack', 'Defense', 'Stamina', 'Balance'] as const;
const TIER_COLORS: Record<string, string> = {
  S: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  A: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  B: 'bg-green-500/20 text-green-400 border-green-500/30',
  C: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const EMPTY: Partial<Beyblade> = { nome: '', ratchet: '', bit: '', tier: 'A', tipo: 'Attack', descricao: '', ativo: true, destaque: false, ordem: 0 };

export default function AdminBeyblades() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Beyblade>>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: beyblades, isLoading } = useQuery({
    queryKey: ['admin-beyblades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beyblades_meta')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Beyblade[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (b: Partial<Beyblade>) => {
      let imagem_url = b.imagem_url ?? null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('beyblades-meta').upload(path, imageFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('beyblades-meta').getPublicUrl(path);
        imagem_url = urlData.publicUrl;
      }

      const payload = {
        nome: b.nome!, ratchet: b.ratchet!, bit: b.bit!, tier: b.tier!, tipo: b.tipo!,
        descricao: b.descricao || null, imagem_url, ativo: b.ativo ?? true,
        destaque: b.destaque ?? false, ordem: b.ordem ?? 0,
      };

      if (b.id) {
        const { error } = await supabase.from('beyblades_meta').update(payload).eq('id', b.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('beyblades_meta').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-beyblades'] });
      toast.success(form.id ? 'Beyblade atualizada!' : 'Beyblade adicionada!');
      closeModal();
    },
    onError: () => toast.error('Erro ao salvar beyblade'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('beyblades_meta').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-beyblades'] });
      toast.success('Beyblade excluída');
      setDeleteId(null);
    },
  });

  const toggleField = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from('beyblades_meta').update({ [field]: value }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-beyblades'] }),
  });

  function openEdit(b: Beyblade) {
    setForm(b);
    setImagePreview(b.imagem_url);
    setImageFile(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview(null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all ${
        selected
          ? 'bg-primary/15 border-primary/40 text-primary'
          : 'border-[rgba(255,255,255,0.1)] text-muted-foreground hover:border-[rgba(255,255,255,0.2)]'
      }`}>{children}</button>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Beyblades Meta</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Gerencie o catálogo de beyblades da plataforma</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Beyblade
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[hsl(var(--bg2))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide w-12"></th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Ratchet</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Bit</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Tier</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Tipo</th>
                <th className="text-center px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Destaque</th>
                <th className="text-center px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Ativo</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><SkeletonBox className="h-4 w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : beyblades?.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground font-body">Nenhuma beyblade cadastrada</td></tr>
              ) : (
                beyblades?.map((b) => (
                  <tr key={b.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3">
                      {b.imagem_url ? (
                        <img src={b.imagem_url} alt={b.nome} className="w-10 h-10 rounded-full object-cover border border-[rgba(255,255,255,0.1)]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                          <Disc3 className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body font-medium text-foreground">{b.nome}</td>
                    <td className="px-4 py-3 font-body text-muted-foreground">{b.ratchet}</td>
                    <td className="px-4 py-3 font-body text-muted-foreground">{b.bit}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${TIER_COLORS[b.tier]}`}>
                        {b.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-muted-foreground">{b.tipo}</td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={b.destaque} onCheckedChange={(v) => toggleField.mutate({ id: b.id, field: 'destaque', value: v })} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={b.ativo} onCheckedChange={(v) => toggleField.mutate({ id: b.id, field: 'ativo', value: v })} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir Beyblade"
        description="Tem certeza que deseja excluir esta beyblade? Esta ação não pode ser desfeita."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
        <DialogContent className="max-w-lg bg-[#111827] border-[rgba(255,255,255,0.07)] rounded-2xl p-7">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold">
              <Disc3 className="h-5 w-5 text-primary" />
              {form.id ? 'Editar Beyblade' : 'Nova Beyblade'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-body">Preencha os dados da beyblade</p>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Image upload */}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer group">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/60 transition-colors" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] border-2 border-dashed border-[rgba(255,255,255,0.15)] flex items-center justify-center group-hover:border-primary/40 transition-colors">
                    <Disc3 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </label>
              <div className="text-xs text-muted-foreground font-body">Clique para upload da imagem</div>
            </div>

            <div>
              <Label className="text-xs font-body">Nome da Blade</Label>
              <Input placeholder="Ex: DranSword" value={form.nome ?? ''} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-body">Ratchet</Label>
                <Input placeholder="Ex: 3-60" value={form.ratchet ?? ''} onChange={(e) => setForm({ ...form, ratchet: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-body">Bit</Label>
                <Input placeholder="Ex: Flat" value={form.bit ?? ''} onChange={(e) => setForm({ ...form, bit: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-body mb-2 block">Tier</Label>
              <div className="flex gap-2">
                {TIERS.map((t) => <Pill key={t} selected={form.tier === t} onClick={() => setForm({ ...form, tier: t })}>{t}</Pill>)}
              </div>
            </div>

            <div>
              <Label className="text-xs font-body mb-2 block">Tipo</Label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => <Pill key={t} selected={form.tipo === t} onClick={() => setForm({ ...form, tipo: t })}>{t}</Pill>)}
              </div>
            </div>

            <div>
              <Label className="text-xs font-body">Descrição</Label>
              <Textarea placeholder="Descrição opcional..." value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-body">Destaque</Label>
                <Switch checked={form.destaque ?? false} onCheckedChange={(v) => setForm({ ...form, destaque: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-body">Ativo</Label>
                <Switch checked={form.ativo ?? true} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              </div>
            </div>

            <div>
              <Label className="text-xs font-body">Ordem (carrossel)</Label>
              <Input type="number" value={form.ordem ?? 0} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} className="mt-1 w-24" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.nome || !form.ratchet || !form.bit || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : form.id ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
