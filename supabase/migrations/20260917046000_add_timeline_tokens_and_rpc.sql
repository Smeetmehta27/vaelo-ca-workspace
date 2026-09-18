-- 1. Add timeline access token fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS timeline_access_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS timeline_token_revoked BOOLEAN DEFAULT false;

-- Create an index for fast lookups via token
CREATE INDEX IF NOT EXISTS idx_clients_timeline_access_token ON clients(timeline_access_token);

-- 2. Create the SECURITY DEFINER RPC to fetch timeline events
-- This bypasses RLS on clients and client_timeline_events to allow external client-facing views
-- It strictly filters for visible_to_client = true and ensures token is not revoked
CREATE OR REPLACE FUNCTION get_client_timeline_by_token(p_token UUID)
RETURNS TABLE (
    client_id UUID,
    company_name TEXT,
    entity_type TEXT,
    event_id UUID,
    event_type TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS client_id,
        c.company_name,
        c.entity_type,
        cte.id AS event_id,
        cte.event_type,
        cte.summary,
        cte.created_at
    FROM clients c
    LEFT JOIN client_timeline_events cte 
        ON c.id = cte.client_id AND cte.visible_to_client = true
    WHERE c.timeline_access_token = p_token
      AND c.timeline_token_revoked = false
    ORDER BY cte.created_at DESC;
END;
$$;
