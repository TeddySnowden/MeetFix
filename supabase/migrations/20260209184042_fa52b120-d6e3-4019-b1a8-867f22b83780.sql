
-- Create event_user_timeline table
CREATE TABLE public.event_user_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  dress_up_time timestamptz,
  travel_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one row per user per event
CREATE UNIQUE INDEX idx_event_user_timeline_event_user ON public.event_user_timeline (event_id, user_id);

-- Enable RLS
ALTER TABLE public.event_user_timeline ENABLE ROW LEVEL SECURITY;

-- Users can view their own timeline entries
CREATE POLICY "Users can view own timeline"
  ON public.event_user_timeline FOR SELECT
  USING (auth.uid() = user_id);

-- Members of the event's group can read timelines
CREATE POLICY "Group members can view timelines"
  ON public.event_user_timeline FOR SELECT
  USING (can_access_group(get_event_group_id(event_id)));

-- Users can insert their own timeline
CREATE POLICY "Users can insert own timeline"
  ON public.event_user_timeline FOR INSERT
  WITH CHECK (auth.uid() = user_id AND can_access_group(get_event_group_id(event_id)));

-- Users can update their own timeline
CREATE POLICY "Users can update own timeline"
  ON public.event_user_timeline FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own timeline
CREATE POLICY "Users can delete own timeline"
  ON public.event_user_timeline FOR DELETE
  USING (auth.uid() = user_id);
