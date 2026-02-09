
-- Drop existing policies on all three tables
DROP POLICY IF EXISTS "Group members can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Creator can update events" ON public.events;
DROP POLICY IF EXISTS "Group members can view time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Authenticated users can create time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Group members can view votes" ON public.time_slot_votes;
DROP POLICY IF EXISTS "Users can cast votes" ON public.time_slot_votes;
DROP POLICY IF EXISTS "Users can remove own votes" ON public.time_slot_votes;

-- Create can_access_group security definer function
CREATE OR REPLACE FUNCTION public.can_access_group(group_id_input uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM groups WHERE id = group_id_input AND created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_id_input AND user_id = auth.uid()
  );
END;
$$;

-- Helper: check if user is group owner for a given group
CREATE OR REPLACE FUNCTION public.is_group_owner(group_id_input uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM groups WHERE id = group_id_input AND created_by = auth.uid()
  );
END;
$$;

-- Helper: check if user is event creator
CREATE OR REPLACE FUNCTION public.is_event_creator(event_id_input uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events WHERE id = event_id_input AND created_by = auth.uid()
  );
END;
$$;

-- Helper: get group_id from event (security definer to avoid RLS issues)
CREATE OR REPLACE FUNCTION public.get_event_group_id(event_id_input uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gid uuid;
BEGIN
  SELECT group_id INTO gid FROM events WHERE id = event_id_input;
  RETURN gid;
END;
$$;

-- ===== EVENTS POLICIES =====
CREATE POLICY "Members can view events" ON public.events
  FOR SELECT USING (public.can_access_group(group_id));

CREATE POLICY "Members can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by AND public.can_access_group(group_id));

CREATE POLICY "Owner can update events" ON public.events
  FOR UPDATE USING (public.is_group_owner(group_id));

CREATE POLICY "Owner can delete events" ON public.events
  FOR DELETE USING (public.is_group_owner(group_id));

-- ===== TIME_SLOTS POLICIES =====
CREATE POLICY "Members can view time slots" ON public.time_slots
  FOR SELECT USING (public.can_access_group(public.get_event_group_id(event_id)));

CREATE POLICY "Creator or owner can add time slots" ON public.time_slots
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (public.is_event_creator(event_id) OR public.is_group_owner(public.get_event_group_id(event_id)))
  );

CREATE POLICY "Creator or owner can delete time slots" ON public.time_slots
  FOR DELETE USING (
    public.is_event_creator(event_id) OR public.is_group_owner(public.get_event_group_id(event_id))
  );

-- ===== TIME_SLOT_VOTES POLICIES =====
CREATE POLICY "Members can view votes" ON public.time_slot_votes
  FOR SELECT USING (public.can_access_group(public.get_event_group_id(event_id)));

CREATE POLICY "Members can cast votes" ON public.time_slot_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_group(public.get_event_group_id(event_id))
  );

CREATE POLICY "Users can remove own votes" ON public.time_slot_votes
  FOR DELETE USING (auth.uid() = user_id);
