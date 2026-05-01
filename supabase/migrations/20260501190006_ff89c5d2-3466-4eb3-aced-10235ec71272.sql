-- Allow any authenticated user (bladers) to view tournaments so they can browse and sign up
CREATE POLICY "Authenticated can view tournaments"
ON public.tournaments
FOR SELECT
TO authenticated
USING (true);