
-- Step 1: Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view groups by invite code" ON public.groups;

-- Step 2: Drop the existing restrictive member policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

CREATE POLICY "Members can view their groups"
ON public.groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
  )
);

-- Step 3: Create a secure RPC for invite code lookups
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(invite_code_input text)
RETURNS TABLE(id uuid, name text, member_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, COUNT(gm.id)::bigint AS member_count
  FROM groups g
  LEFT JOIN group_members gm ON gm.group_id = g.id
  WHERE g.invite_code = upper(invite_code_input)
  GROUP BY g.id, g.name;
END;
$$;
