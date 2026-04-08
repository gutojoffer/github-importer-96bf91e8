-- Create storage bucket for liga logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos-ligas', 'logos-ligas', true);

-- Create storage bucket for blader avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('blader-avatars', 'blader-avatars', true);

-- Public read access for logos
CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos-ligas');

-- Authenticated users can upload their own logos (folder = user id)
CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos-ligas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own logos
CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos-ligas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own logos
CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos-ligas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for blader avatars
CREATE POLICY "Blader avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blader-avatars');

-- Authenticated users can upload blader avatars
CREATE POLICY "Users can upload blader avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blader-avatars' AND auth.uid() IS NOT NULL);

-- Users can update blader avatars
CREATE POLICY "Users can update blader avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blader-avatars' AND auth.uid() IS NOT NULL);

-- Users can delete blader avatars
CREATE POLICY "Users can delete blader avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'blader-avatars' AND auth.uid() IS NOT NULL);