
-- Activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activities"
  ON public.activities FOR SELECT
  USING (can_access_group(get_event_group_id(event_id)));

CREATE POLICY "Members can add activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = created_by AND can_access_group(get_event_group_id(event_id)));

CREATE POLICY "Creator or owner can delete activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = created_by OR is_group_owner(get_event_group_id(event_id)));

-- Activity votes table
CREATE TABLE public.activity_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

ALTER TABLE public.activity_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activity votes"
  ON public.activity_votes FOR SELECT
  USING (can_access_group(get_event_group_id(event_id)));

CREATE POLICY "Members can cast activity votes"
  ON public.activity_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND can_access_group(get_event_group_id(event_id)));

CREATE POLICY "Users can remove own activity votes"
  ON public.activity_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Add finalized_activity column to events
ALTER TABLE public.events ADD COLUMN finalized_activity TEXT;
