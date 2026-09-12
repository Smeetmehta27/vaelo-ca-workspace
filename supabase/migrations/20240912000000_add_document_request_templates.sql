-- Adds document request template tables (FR-DOC-3)

-- document_request_templates
CREATE TABLE document_request_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_id uuid NOT NULL REFERENCES ca_profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- document_request_template_items
CREATE TABLE document_request_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES document_request_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE document_request_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "CAs can manage their own templates" ON document_request_templates FOR ALL
USING (ca_id = auth.uid())
WITH CHECK (ca_id = auth.uid());

CREATE POLICY "CAs can manage their own template items" ON document_request_template_items FOR ALL
USING (EXISTS (SELECT 1 FROM document_request_templates WHERE document_request_templates.id = document_request_template_items.template_id AND document_request_templates.ca_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM document_request_templates WHERE document_request_templates.id = document_request_template_items.template_id AND document_request_templates.ca_id = auth.uid()));
