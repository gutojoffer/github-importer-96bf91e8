import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SkeletonBox from '@/components/SkeletonBox';

export default function AdminLigas() {
  const { data: ligas, isLoading } = useQuery({
    queryKey: ['admin-ligas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_liga, cidade, logo_url, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Ligas</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Visualize todas as ligas cadastradas na plataforma</p>
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[hsl(var(--bg2))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide w-12"></th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Cidade</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-body uppercase tracking-wide">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-5 py-3"><SkeletonBox className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : ligas?.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground font-body">Nenhuma liga cadastrada</td></tr>
              ) : (
                ligas?.map((l) => (
                  <tr key={l.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-5 py-3">
                      {l.logo_url ? (
                        <img src={l.logo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-[rgba(255,255,255,0.1)]" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(l.nome_liga || '?')[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-body font-medium text-foreground">{l.nome_liga || '—'}</td>
                    <td className="px-5 py-3 font-body text-muted-foreground">{l.cidade || '—'}</td>
                    <td className="px-5 py-3 font-body text-muted-foreground">
                      {l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
