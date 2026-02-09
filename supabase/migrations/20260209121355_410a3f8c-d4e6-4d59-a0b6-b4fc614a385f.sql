
-- bring_items table
CREATE TABLE public.bring_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '📦',
  created_by uuid NOT NULL,
  is_suggestion boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, name)
);

ALTER TABLE public.bring_items ENABLE ROW LEVEL SECURITY;

-- item_claims table
CREATE TABLE public.item_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.bring_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  claimed_at timestamp with time zone DEFAULT now(),
  UNIQUE(item_id),
  UNIQUE(user_id)
);

ALTER TABLE public.item_claims ENABLE ROW LEVEL SECURITY;

-- Helper: get group_id from a bring_item
CREATE OR REPLACE FUNCTION public.get_item_group_id(item_id_input uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  gid uuid;
BEGIN
  SELECT e.group_id INTO gid
  FROM bring_items bi
  JOIN events e ON e.id = bi.event_id
  WHERE bi.id = item_id_input;
  RETURN gid;
END;
$$;

-- bring_items RLS
CREATE POLICY "Members can view bring items"
  ON public.bring_items FOR SELECT
  USING (can_access_group(get_event_group_id(event_id)));

CREATE POLICY "Members can add bring items"
  ON public.bring_items FOR INSERT
  WITH CHECK (auth.uid() = created_by AND can_access_group(get_event_group_id(event_id)));

CREATE POLICY "Creator or owner can delete bring items"
  ON public.bring_items FOR DELETE
  USING (auth.uid() = created_by OR is_group_owner(get_event_group_id(event_id)));

-- item_claims RLS
CREATE POLICY "Members can view claims"
  ON public.item_claims FOR SELECT
  USING (can_access_group(get_item_group_id(id)));

CREATE POLICY "Members can claim items"
  ON public.item_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id AND can_access_group(get_item_group_id(item_id)));

CREATE POLICY "Users can unclaim own items"
  ON public.item_claims FOR DELETE
  USING (auth.uid() = user_id);
