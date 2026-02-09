
-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Members can view group members" ON group_members;

-- Create non-recursive policy that checks membership via groups table
CREATE POLICY "Members can view group members" ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_members.group_id
    AND groups.created_by = auth.uid()
  )
  OR user_id = auth.uid()
);
