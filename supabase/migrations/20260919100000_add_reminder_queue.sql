-- 1. Create reminder_queue table
CREATE TABLE reminder_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('document', 'compliance', 'notice')),
  reference_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Prevent duplicate pending reminders for the same item
CREATE UNIQUE INDEX idx_unique_pending_reminder ON reminder_queue (item_type, reference_id) WHERE status = 'pending';

-- 3. Enable RLS
ALTER TABLE reminder_queue ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Team can view their assigned client reminders" ON reminder_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = reminder_queue.client_id
      AND EXISTS (
        SELECT 1 FROM get_my_team_memberships() tm 
        WHERE tm.firm_id = c.ca_id 
        AND (tm.role IN ('owner','partner') OR c.assigned_to = tm.id)
      )
    )
  );

CREATE POLICY "Team can update their assigned client reminders" ON reminder_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = reminder_queue.client_id
      AND EXISTS (
        SELECT 1 FROM get_my_team_memberships() tm 
        WHERE tm.firm_id = c.ca_id 
        AND (tm.role IN ('owner','partner') OR c.assigned_to = tm.id)
      )
    )
  );

-- Note: Insert is only done via the CRON background job using service_role bypass.
