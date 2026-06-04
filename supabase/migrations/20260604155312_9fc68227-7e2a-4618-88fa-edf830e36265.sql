
-- 1. Drop broad authenticated SELECT on bladers_temp (PII exposure)
DROP POLICY IF EXISTS autenticado_ver_temp_em_torneios ON public.bladers_temp;

-- 2. Tighten notificacoes INSERT: must target self only
DROP POLICY IF EXISTS autenticados_podem_criar_notificacoes ON public.notificacoes;
CREATE POLICY "users_can_create_own_notifications"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Scope blader-avatars DELETE/UPDATE to owner (folder = user id)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%blader-avatars%' OR with_check ILIKE '%blader-avatars%')
      AND cmd IN ('UPDATE','DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "blader_avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blader-avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'blader-avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "blader_avatars_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blader-avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. Remove self-promote-to-admin policy (privilege escalation)
DROP POLICY IF EXISTS "Self-promote to admin when none exists" ON public.user_roles;
