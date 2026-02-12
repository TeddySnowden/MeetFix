
-- Drop one-claim-per-item unique constraint, allow multiple claims
ALTER TABLE public.item_claims DROP CONSTRAINT IF EXISTS item_claims_item_id_key;
-- Drop one-claim-per-user unique constraint
ALTER TABLE public.item_claims DROP CONSTRAINT IF EXISTS item_claims_user_id_key;
-- Add unique on (item_id, user_id) so a user can't claim same item twice
ALTER TABLE public.item_claims ADD CONSTRAINT item_claims_item_user_unique UNIQUE (item_id, user_id);
