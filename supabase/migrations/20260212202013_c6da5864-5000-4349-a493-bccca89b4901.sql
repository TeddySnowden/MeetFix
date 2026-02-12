
CREATE OR REPLACE FUNCTION public.create_group(group_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_group_id uuid;
  new_invite_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result jsonb;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate 6-char invite code
  new_invite_code := '';
  FOR i IN 1..6 LOOP
    new_invite_code := new_invite_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Insert group
  INSERT INTO groups (name, created_by, invite_code)
  VALUES (group_name, auth.uid(), new_invite_code)
  RETURNING id INTO new_group_id;

  -- Insert owner membership
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'owner');

  -- Return result
  result := jsonb_build_object(
    'id', new_group_id,
    'name', group_name,
    'invite_code', new_invite_code
  );

  RETURN result;
END;
$$;
