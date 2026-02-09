ALTER TABLE public.groups ADD COLUMN max_members integer NOT NULL DEFAULT 999;

-- Allow owners to update their groups (for max_members and invite_code)
CREATE POLICY "Owner can update groups"
ON public.groups
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);