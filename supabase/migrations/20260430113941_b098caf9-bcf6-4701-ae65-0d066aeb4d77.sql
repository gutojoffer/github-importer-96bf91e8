INSERT INTO storage.buckets (id, name, public)
VALUES ('bey-parts', 'bey-parts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "bey_parts_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bey-parts');

CREATE POLICY "bey_parts_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bey-parts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "bey_parts_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'bey-parts' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "bey_parts_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'bey-parts' AND public.has_role(auth.uid(), 'admin'));