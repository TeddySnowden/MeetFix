
-- Add packed_up column to events
ALTER TABLE public.events ADD COLUMN packed_up boolean NOT NULL DEFAULT false;

-- Update the existing UPDATE policy to also allow event creator (not just group owner)
DROP POLICY IF EXISTS "Owner can update events" ON public.events;
CREATE POLICY "Owner or creator can update events"
ON public.events
FOR UPDATE
USING ((created_by = auth.uid()) OR is_group_owner(group_id));

-- Enable realtime for events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
