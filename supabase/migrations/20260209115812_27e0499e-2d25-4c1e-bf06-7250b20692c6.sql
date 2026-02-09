
-- 1) events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id),
  name text NOT NULL DEFAULT 'Meeting',
  status text NOT NULL DEFAULT 'voting',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events: group members can view
CREATE POLICY "Group members can view events" ON public.events
  FOR SELECT USING (public.can_view_group_members(group_id));

-- Events: authenticated users can create (must be creator)
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Events: creator can update (e.g. finalize)
CREATE POLICY "Creator can update events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

-- 2) time_slots table
CREATE TABLE public.time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  slot_at timestamp with time zone NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, slot_at)
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- time_slots: reuse group membership check via event->group
CREATE OR REPLACE FUNCTION public.can_view_event(event_id_input uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_id_input
      AND public.can_view_group_members(e.group_id)
  );
END;
$$;

CREATE POLICY "Group members can view time slots" ON public.time_slots
  FOR SELECT USING (public.can_view_event(event_id));

CREATE POLICY "Authenticated users can create time slots" ON public.time_slots
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 3) time_slot_votes table
CREATE TABLE public.time_slot_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  time_slot_id uuid NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, time_slot_id)
);

ALTER TABLE public.time_slot_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view votes" ON public.time_slot_votes
  FOR SELECT USING (public.can_view_event(event_id));

CREATE POLICY "Users can cast votes" ON public.time_slot_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON public.time_slot_votes
  FOR DELETE USING (auth.uid() = user_id);
