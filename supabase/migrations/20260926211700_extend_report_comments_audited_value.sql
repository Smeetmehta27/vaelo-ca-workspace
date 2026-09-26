-- Extend report_comments for AuditedValue snapshoting
ALTER TABLE report_comments
ADD COLUMN figure_formula text,
ADD COLUMN figure_inputs jsonb;
