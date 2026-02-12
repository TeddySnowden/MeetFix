
-- Fix broken SELECT policy: was using `id` (claim id) instead of `item_id`
DROP POLICY "Members can view claims" ON public.item_claims;
CREATE POLICY "Members can view claims"
  ON public.item_claims
  FOR SELECT
  USING (can_access_group(get_item_group_id(item_id)));
