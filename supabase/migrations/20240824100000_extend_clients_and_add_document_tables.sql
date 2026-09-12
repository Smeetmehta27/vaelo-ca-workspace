-- Extends clients per FR-CLI-1, adds document collection tables per FR-DOC-1-4

-- Part A: Extend the clients table
ALTER TABLE clients
  ADD COLUMN gstin text,
  ADD COLUMN pan text,
  ADD COLUMN filing_frequency text,
  ADD COLUMN registration_date date,
  ADD COLUMN primary_contact_name text,
  ADD COLUMN primary_contact_phone text,
  ADD COLUMN primary_contact_email text;

-- Part B: Document collection tables

-- document_request_lists
CREATE TABLE document_request_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_type text,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- document_request_items
CREATE TABLE document_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES document_request_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  due_date date,
  status text NOT NULL DEFAULT 'requested',
  storage_path text,
  updated_at timestamptz DEFAULT now()
);

-- Part C: RLS

ALTER TABLE document_request_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CAs can manage document request lists for their clients" ON document_request_lists FOR ALL
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = document_request_lists.client_id AND clients.ca_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = document_request_lists.client_id AND clients.ca_id = auth.uid()));

CREATE POLICY "CAs can manage document request items for their clients" ON document_request_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM document_request_lists 
  JOIN clients ON clients.id = document_request_lists.client_id 
  WHERE document_request_lists.id = document_request_items.list_id AND clients.ca_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM document_request_lists 
  JOIN clients ON clients.id = document_request_lists.client_id 
  WHERE document_request_lists.id = document_request_items.list_id AND clients.ca_id = auth.uid()
));
