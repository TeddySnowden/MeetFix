
-- Create security definer function
CREATE OR REPLACE FUNCTION public.can_view_group_members(group_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM groups 
    WHERE id = group_id_input AND created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_id_input AND user_id = auth.uid()
  );
END;
$$;

-- Drop old policy and recreate using the function
DROP POLICY IF EXISTS "Members can view group members" ON group_members;

CREATE POLICY "Members can view group members" ON group_members
FOR SELECT
USING (public.can_view_group_members(group_id));
