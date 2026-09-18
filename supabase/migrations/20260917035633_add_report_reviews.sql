-- Part A: Update the report_status enum
-- 'draft', 'reviewed', 'finalized' -> 'draft', 'submitted_for_review', 'changes_requested', 'approved', 'finalized'
ALTER TYPE report_status RENAME VALUE 'reviewed' TO 'approved';
ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'submitted_for_review' AFTER 'draft';
ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'changes_requested' AFTER 'submitted_for_review';

-- Part B: Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Part C: Create report_comments table
CREATE TABLE report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  figure_reference text,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Part D: Create report_status_history table
CREATE TABLE report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status report_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Trigger function to track report status changes
CREATE OR REPLACE FUNCTION trg_record_report_status_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO report_status_history (report_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to reports table
CREATE TRIGGER report_status_change_trigger
  AFTER INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION trg_record_report_status_change();


-- Part E: RLS Policies

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Team can view and manage comments for assigned clients" ON report_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reports
      JOIN clients ON clients.id = reports.client_id
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE reports.id = report_comments.report_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

CREATE POLICY "Team can view report status history for assigned clients" ON report_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports
      JOIN clients ON clients.id = reports.client_id
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE reports.id = report_status_history.report_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );
