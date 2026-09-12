-- Adds tokenized access for clients to upload documents (FR-DOC-4)
-- This uses SECURITY DEFINER functions deliberately without any anon RLS policy.

-- Part A: Token columns
ALTER TABLE document_request_lists
  ADD COLUMN access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN token_revoked boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX idx_document_request_lists_token ON document_request_lists(access_token);

-- Part B: SECURITY DEFINER function — read
CREATE OR REPLACE FUNCTION get_document_request_list_by_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list record;
  v_items json;
BEGIN
  -- Look up the list
  SELECT id, title, report_type, created_at
  INTO v_list
  FROM document_request_lists
  WHERE access_token = p_token AND token_revoked = false;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Look up the items
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'required', required,
      'due_date', due_date,
      'status', status,
      'updated_at', updated_at
    )
  ), '[]'::json)
  INTO v_items
  FROM document_request_items
  WHERE list_id = v_list.id;

  RETURN json_build_object(
    'list', json_build_object(
      'id', v_list.id,
      'title', v_list.title,
      'report_type', v_list.report_type,
      'created_at', v_list.created_at
    ),
    'items', v_items
  );
END;
$$;

-- Part C: SECURITY DEFINER function — write
CREATE OR REPLACE FUNCTION upload_document_item_via_token(p_item_id uuid, p_token uuid, p_storage_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list_id uuid;
  v_current_status text;
BEGIN
  -- Verify the item belongs to a list with the matching token
  SELECT i.list_id, i.status
  INTO v_list_id, v_current_status
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

  RETURN true;
END;
$$;

-- Part D: Grants
REVOKE EXECUTE ON FUNCTION get_document_request_list_by_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION upload_document_item_via_token(uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_document_request_list_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upload_document_item_via_token(uuid, uuid, text) TO anon, authenticated;
