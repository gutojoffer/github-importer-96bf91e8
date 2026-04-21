import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TipoConta = 'organizador' | 'blader';

export interface BladerProfile {
  tipoConta: TipoConta;
  /** Nome da liga (organizador) */
  nome: string | null;
  /** Nome do blader */
  nomeBlader: string | null;
  cidade: string | null;
  /** Cidade específica do blader (se diferente) */
  cidadeBlader: string | null;
  beybladeFavorita: string | null;
  /** Avatar da liga/organizador */
  avatarUrl: string | null;
  /** Avatar específico do blader */
  avatarBladerUrl: string | null;
  bio: string | null;
  /** Bio específica do blader */
  bioBlader: string | null;
  corPerfil: string;
  estado: string | null;
  /** Estado específico do blader */
  estadoBlader: string | null;
  /** Logo da liga */
  logoUrl: string | null;
  isComplete: boolean;
  temPerfilBlader: boolean;
  temPerfilOrganizador: boolean;
  hasDualProfile: boolean;
}

/**
 * Lê o perfil do usuário logado.
 */
export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BladerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setProfile(null); setLoading(false); return; }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tipo_conta, nome_liga, cidade, beyblade_favorita, avatar_url, bio, tem_perfil_blader, tem_perfil_organizador, cor_perfil, estado, logo_url, nome_blader, avatar_blader_url, cidade_blader, estado_blader, bio_blader')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!data) {
        setProfile({
          tipoConta: 'organizador',
          nome: null, nomeBlader: null,
          cidade: null, cidadeBlader: null,
          beybladeFavorita: null,
          avatarUrl: null, avatarBladerUrl: null,
          bio: null, bioBlader: null,
          corPerfil: 'blue', estado: null, estadoBlader: null,
          logoUrl: null,
          isComplete: false,
          temPerfilBlader: false,
          temPerfilOrganizador: false,
          hasDualProfile: false,
        });
      } else {
        const d = data as any;
        const tipoConta = (d.tipo_conta as TipoConta) || 'organizador';
        const temPerfilBlader = !!d.tem_perfil_blader;
        const temPerfilOrganizador = !!d.tem_perfil_organizador || tipoConta === 'organizador';
        const isComplete = tipoConta === 'organizador'
          ? !!d.nome_liga
          : !!(d.nome_blader && (d.cidade_blader || d.cidade));
        setProfile({
          tipoConta,
          nome: d.nome_liga,
          nomeBlader: d.nome_blader || null,
          cidade: d.cidade,
          cidadeBlader: d.cidade_blader || null,
          beybladeFavorita: d.beyblade_favorita,
          avatarUrl: d.avatar_url,
          avatarBladerUrl: d.avatar_blader_url || null,
          bio: d.bio,
          bioBlader: d.bio_blader || null,
          corPerfil: d.cor_perfil || 'blue',
          estado: d.estado ?? null,
          estadoBlader: d.estado_blader || null,
          logoUrl: d.logo_url || null,
          isComplete,
          temPerfilBlader,
          temPerfilOrganizador,
          hasDualProfile: temPerfilBlader && temPerfilOrganizador,
        });
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, authLoading, refreshKey]);

  return { profile, loading: authLoading || loading, refresh };
}
