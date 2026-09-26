ALTER TABLE notices
ADD COLUMN response_template_version_id uuid REFERENCES notice_response_templates(id);
