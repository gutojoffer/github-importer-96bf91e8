import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TipoConta = 'organizador' | 'blader';

export interface BladerProfile {
  tipoConta: TipoConta;
  nome: string | null;
  cidade: string | null;
  beybladeFavorita: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isComplete: boolean;
  /** Se a conta tem o perfil de Blader habilitado. */
  temPerfilBlader: boolean;
  /** Se a conta tem o perfil de Organizador habilitado. */
  temPerfilOrganizador: boolean;
  /** True quando a conta tem AMBOS os perfis disponíveis. */
  hasDualProfile: boolean;
}

/**
 * Lê o perfil do usuário logado.
 */
export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<BladerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setProfile(null); setLoading(false); return; }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tipo_conta, nome_liga, cidade, beyblade_favorita, avatar_url, bio, tem_perfil_blader, tem_perfil_organizador')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!data) {
        setProfile({
          tipoConta: 'organizador',
          nome: null, cidade: null, beybladeFavorita: null, avatarUrl: null, bio: null,
          isComplete: false,
          temPerfilBlader: false,
          temPerfilOrganizador: false,
          hasDualProfile: false,
        });
      } else {
        const tipoConta = (data.tipo_conta as TipoConta) || 'organizador';
        const nome = data.nome_liga;
        const cidade = data.cidade;
        const temPerfilBlader = !!data.tem_perfil_blader;
        // Backward-compat: se for organizador ou já tiver nome_liga, considera org=true
        const temPerfilOrganizador = !!(data as { tem_perfil_organizador?: boolean }).tem_perfil_organizador
          || tipoConta === 'organizador';
        const isComplete = tipoConta === 'organizador'
          ? !!nome
          : !!(nome && cidade);
        setProfile({
          tipoConta,
          nome,
          cidade,
          beybladeFavorita: data.beyblade_favorita,
          avatarUrl: data.avatar_url,
          bio: data.bio,
          isComplete,
          temPerfilBlader,
          temPerfilOrganizador,
          hasDualProfile: temPerfilBlader && temPerfilOrganizador,
        });
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { profile, loading: authLoading || loading };
}
