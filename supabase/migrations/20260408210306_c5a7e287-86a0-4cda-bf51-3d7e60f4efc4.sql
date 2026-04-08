-- Allow anyone to check if an admin role exists (for setup-admin page guard)
CREATE POLICY "Anyone can check admin existence"
ON public.user_roles
FOR SELECT
USING (role = 'admin');

-- Allow a user to promote themselves to admin ONLY if no admin exists yet
CREATE POLICY "Self-promote to admin when none exists"
ON public.user_roles
FOR UPDATE
USING (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2 WHERE ur2.role = 'admin' AND ur2.user_id != auth.uid()
  )
);