import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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

const PROFILE_COLS = 'tipo_conta, nome_liga, cidade, beyblade_favorita, avatar_url, bio, tem_perfil_blader, tem_perfil_organizador, cor_perfil, estado, logo_url, nome_blader, avatar_blader_url, cidade_blader, estado_blader, bio_blader';

function mapProfile(data: any): BladerProfile {
  if (!data) {
    return {
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
    };
  }
  const tipoConta = (data.tipo_conta as TipoConta) || 'organizador';
  const temPerfilBlader = !!(data.tem_perfil_blader && data.nome_blader);
  const temPerfilOrganizador = !!(data.nome_liga || data.tem_perfil_organizador || tipoConta === 'organizador');
  const isComplete = tipoConta === 'organizador'
    ? !!data.nome_liga
    : !!(data.nome_blader && (data.cidade_blader || data.cidade));
  return {
    tipoConta,
    nome: data.nome_liga,
    nomeBlader: data.nome_blader || null,
    cidade: data.cidade,
    cidadeBlader: data.cidade_blader || null,
    beybladeFavorita: data.beyblade_favorita,
    avatarUrl: data.avatar_url,
    avatarBladerUrl: data.avatar_blader_url || null,
    bio: data.bio,
    bioBlader: data.bio_blader || null,
    corPerfil: data.cor_perfil || 'blue',
    estado: data.estado ?? null,
    estadoBlader: data.estado_blader || null,
    logoUrl: data.logo_url || null,
    isComplete,
    temPerfilBlader,
    temPerfilOrganizador,
    hasDualProfile: temPerfilBlader && temPerfilOrganizador,
  };
}

/**
 * Lê o perfil do usuário logado. Cacheado via react-query, compartilhado entre componentes.
 */
export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const { data: profile = null, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select(PROFILE_COLS)
        .eq('id', user.id)
        .maybeSingle();
      return mapProfile(data);
    },
    enabled: !!user && !authLoading,
    staleTime: 60_000,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['user-profile', user?.id] });
  }, [qc, user?.id]);

  return { profile, loading: authLoading || (!!user && isLoading), refresh };
}
