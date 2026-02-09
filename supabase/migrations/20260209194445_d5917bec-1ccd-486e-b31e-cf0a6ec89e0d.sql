-- Add unique constraint on group_members for upsert support
ALTER TABLE public.group_members ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);