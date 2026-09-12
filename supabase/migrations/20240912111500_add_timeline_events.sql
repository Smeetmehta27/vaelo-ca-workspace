-- Adds client timeline events table and wiring for document requests

CREATE TABLE client_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  summary text NOT NULL,
  ref_table text,
  ref_id uuid,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CAs can manage timeline events for their clients" ON client_timeline_events FOR ALL
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_timeline_events.client_id AND clients.ca_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_timeline_events.client_id AND clients.ca_id = auth.uid()));

-- Part C: SECURITY DEFINER function - write (updated to insert timeline event)
CREATE OR REPLACE FUNCTION upload_document_item_via_token(p_item_id uuid, p_token uuid, p_storage_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list_id uuid;
  v_client_id uuid;
  v_item_name text;
  v_current_status text;
BEGIN
  -- Verify the item belongs to a list with the matching token
  SELECT i.list_id, i.name, i.status, l.client_id
  INTO v_list_id, v_item_name, v_current_status, v_client_id
  FROM document_request_items i
  JOIN document_request_lists l ON i.list_id = l.id
  WHERE i.id = p_item_id 
    AND l.access_token = p_token 
    AND l.token_revoked = false;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Only allow if current status is 'requested' or 'rejected'
  IF v_current_status NOT IN ('requested', 'rejected') THEN
    RETURN false;
  END IF;

  -- Update the item
  UPDATE document_request_items
  SET 
    status = 'received',
    storage_path = p_storage_path,
    updated_at = now()
  WHERE id = p_item_id;

  -- Insert timeline event
  INSERT INTO client_timeline_events (
    client_id, event_type, summary, ref_table, ref_id, visible_to_client
  ) VALUES (
    v_client_id,
    'item_received',
    '''' || v_item_name || ''' uploaded by client',
    'document_request_items',
    p_item_id,
    true
  );

  RETURN true;
END;
$$;
