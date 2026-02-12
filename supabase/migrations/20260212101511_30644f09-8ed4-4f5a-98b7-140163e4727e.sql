CREATE POLICY "Users can update own claims"
ON public.item_claims
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);