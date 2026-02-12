
-- Function to delete expired events (earliest slot_at < NOW() - 1 day)
CREATE OR REPLACE FUNCTION public.cleanup_expired_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH expired AS (
    SELECT e.id
    FROM events e
    INNER JOIN time_slots ts ON ts.event_id = e.id
    GROUP BY e.id
    HAVING MAX(ts.slot_at) < NOW() - INTERVAL '1 day'
  )
  DELETE FROM events WHERE id IN (SELECT id FROM expired);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
