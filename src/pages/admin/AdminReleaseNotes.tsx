import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SkeletonBox from '@/components/SkeletonBox';
import ConfirmDialog from '@/components/ConfirmDialog';

type ReleaseNote = {
  id: string;
  titulo: string;
  descricao: string;
  versao: string;
  tag: string;
  data: string;
  publicado: boolean;
};

const TAGS = ['novo', 'melhoria', 'fix', 'destaque'] as const;
const TAG_COLORS: Record<string, string> = {
  novo: 'bg-green-500/20 text-green-400 border-green-500/30',
  melhoria: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fix: 'bg-red-500/20 text-red-400 border-red-500/30',
  destaque: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const EMPTY: Partial<ReleaseNote> = { titulo: '', descricao: '', versao: '', tag: 'novo', data: new Date().toISOString().split('T')[0], publicado: false };

export default function AdminReleaseNotes() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<ReleaseNote>>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: notes, isLoading } = useQuery({
    queryKey: ['admin-release-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('release_notes')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReleaseNote[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (n: Partial<ReleaseNote>) => {
      const payload = {
        titulo: n.titulo!, descricao: n.descricao!, versao: n.versao!,
        tag: n.tag!, data: n.data!, publicado: n.publicado ?? false,
      };
      if (n.id) {
        const { error } = await supabase.from('release_notes').update(payload).eq('id', n.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('release_notes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-release-notes'] });
      toast.success(form.id ? 'Release note atualizada!' : 'Release note criada!');
      closeModal();
    },
    onError: () => toast.error('Erro ao salvar release note'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('release_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-release-notes'] });
      toast.success('Release note excluída');
      setDeleteId(null);
    },
  });

  function closeModal() {
    setModalOpen(false);
    setForm(EMPTY);
  }

  function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all ${
        selected ? 'bg-primary/15 border-primary/40 text-primary' : 'border-[rgba(255,255,255,0.1)] text-muted-foreground hover:border-[rgba(255,255,255,0.2)]'
      }`}>{children}</button>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Release Notes</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Gerencie as notas de atualização do sistema</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Release Note
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} className="h-20 w-full rounded-xl" />)
        ) : notes?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-body">Nenhuma release note</div>
        ) : (
          notes?.map((n) => (
            <div key={n.id} className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[hsl(var(--bg2))] p-4 flex items-start gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${TAG_COLORS[n.tag]}`}>{n.tag}</span>
                  <span className="text-xs text-muted-foreground font-body">v{n.versao}</span>
                  <span className="text-xs text-muted-foreground font-body">•</span>
                  <span className="text-xs text-muted-foreground font-body">{new Date(n.data).toLocaleDateString('pt-BR')}</span>
                  {n.publicado ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">Publicado</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/15 text-gray-400 border border-gray-500/20">Rascunho</span>
                  )}
                </div>
                <h3 className="font-heading text-base font-bold text-foreground mt-1">{n.titulo}</h3>
                <p className="text-sm text-muted-foreground font-body mt-0.5 line-clamp-2 whitespace-pre-line">{n.descricao}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setForm(n); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteId(n.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir Release Note"
        description="Tem certeza? Esta ação não pode ser desfeita."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />

      <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
        <DialogContent className="max-w-lg bg-[#111827] border-[rgba(255,255,255,0.07)] rounded-2xl p-7">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl font-bold">
              <FileText className="h-5 w-5 text-primary" />
              {form.id ? 'Editar Release Note' : 'Nova Release Note'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-body">Versão</Label>
                <Input placeholder="Ex: 1.2.0" value={form.versao ?? ''} onChange={(e) => setForm({ ...form, versao: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-body">Data</Label>
                <Input type="date" value={form.data ?? ''} onChange={(e) => setForm({ ...form, data: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-body">Título</Label>
              <Input placeholder="Título da atualização" value={form.titulo ?? ''} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-body">Descrição</Label>
              <Textarea placeholder="Descreva as mudanças..." value={form.descricao ?? ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" rows={4} />
            </div>
            <div>
              <Label className="text-xs font-body mb-2 block">Tag</Label>
              <div className="flex gap-2">
                {TAGS.map((t) => <Pill key={t} selected={form.tag === t} onClick={() => setForm({ ...form, tag: t })}>{t}</Pill>)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-body">Publicar</Label>
              <Switch checked={form.publicado ?? false} onCheckedChange={(v) => setForm({ ...form, publicado: v })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.titulo || !form.versao || !form.descricao || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : form.id ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
