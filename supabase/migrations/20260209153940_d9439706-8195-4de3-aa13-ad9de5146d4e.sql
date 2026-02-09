
-- 1. Allow group owners to delete groups
CREATE POLICY "Owner can delete groups"
ON public.groups
FOR DELETE
USING (auth.uid() = created_by);

-- 2. Update events delete policy to also allow event creator
DROP POLICY IF EXISTS "Owner can delete events" ON public.events;
CREATE POLICY "Owner or creator can delete events"
ON public.events
FOR DELETE
USING (created_by = auth.uid() OR is_group_owner(group_id));

-- 3. Add CASCADE to foreign keys so deleting group/event cleans up children

-- events -> groups
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_group_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- time_slots -> events
ALTER TABLE public.time_slots DROP CONSTRAINT IF EXISTS time_slots_event_id_fkey;
ALTER TABLE public.time_slots ADD CONSTRAINT time_slots_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- time_slot_votes -> events
ALTER TABLE public.time_slot_votes DROP CONSTRAINT IF EXISTS time_slot_votes_event_id_fkey;
ALTER TABLE public.time_slot_votes ADD CONSTRAINT time_slot_votes_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- time_slot_votes -> time_slots
ALTER TABLE public.time_slot_votes DROP CONSTRAINT IF EXISTS time_slot_votes_time_slot_id_fkey;
ALTER TABLE public.time_slot_votes ADD CONSTRAINT time_slot_votes_time_slot_id_fkey
  FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE CASCADE;

-- activities -> events
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_event_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- activity_votes -> events
ALTER TABLE public.activity_votes DROP CONSTRAINT IF EXISTS activity_votes_event_id_fkey;
ALTER TABLE public.activity_votes ADD CONSTRAINT activity_votes_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- activity_votes -> activities
ALTER TABLE public.activity_votes DROP CONSTRAINT IF EXISTS activity_votes_activity_id_fkey;
ALTER TABLE public.activity_votes ADD CONSTRAINT activity_votes_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

-- bring_items -> events
ALTER TABLE public.bring_items DROP CONSTRAINT IF EXISTS bring_items_event_id_fkey;
ALTER TABLE public.bring_items ADD CONSTRAINT bring_items_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- item_claims -> bring_items
ALTER TABLE public.item_claims DROP CONSTRAINT IF EXISTS item_claims_item_id_fkey;
ALTER TABLE public.item_claims ADD CONSTRAINT item_claims_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES public.bring_items(id) ON DELETE CASCADE;

-- group_members -> groups
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE public.group_members ADD CONSTRAINT group_members_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- events finalized_slot -> time_slots (set null on delete)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_finalized_slot_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_finalized_slot_id_fkey
  FOREIGN KEY (finalized_slot_id) REFERENCES public.time_slots(id) ON DELETE SET NULL;
