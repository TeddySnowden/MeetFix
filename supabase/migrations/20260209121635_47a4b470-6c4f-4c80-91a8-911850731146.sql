
-- Add finalized fields to events
ALTER TABLE public.events
  ADD COLUMN finalized_slot_id uuid REFERENCES public.time_slots(id),
  ADD COLUMN finalized_date timestamp with time zone;
