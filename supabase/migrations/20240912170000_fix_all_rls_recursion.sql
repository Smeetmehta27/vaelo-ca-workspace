-- 1. Create SECURITY DEFINER helper function to bypass RLS for lookups
CREATE OR REPLACE FUNCTION public.get_my_team_memberships()
RETURNS TABLE(id uuid, firm_id uuid, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id, firm_id, role FROM team_members WHERE user_id = auth.uid() $$;

-- 2. Drop and recreate team_members policies
DROP POLICY IF EXISTS "Team members can view firm roster" ON team_members;
CREATE POLICY "Team members can view firm roster" ON team_members
  FOR SELECT USING (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm));

DROP POLICY IF EXISTS "Owners and partners can insert team members" ON team_members;
CREATE POLICY "Owners and partners can insert team members" ON team_members
  FOR INSERT WITH CHECK (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')));

DROP POLICY IF EXISTS "Owners and partners can update team members" ON team_members;
CREATE POLICY "Owners and partners can update team members" ON team_members
  FOR UPDATE USING (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')))
  WITH CHECK (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')));

DROP POLICY IF EXISTS "Owners and partners can delete team members" ON team_members;
CREATE POLICY "Owners and partners can delete team members" ON team_members
  FOR DELETE USING (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')));


-- 3. Drop and recreate team_invites policies
DROP POLICY IF EXISTS "Owners and partners can view invites" ON team_invites;
CREATE POLICY "Owners and partners can view invites" ON team_invites
  FOR SELECT USING (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')));

DROP POLICY IF EXISTS "Owners and partners can insert invites" ON team_invites;
CREATE POLICY "Owners and partners can insert invites" ON team_invites
  FOR INSERT WITH CHECK (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')));

DROP POLICY IF EXISTS "Owners and partners can update invites" ON team_invites;
CREATE POLICY "Owners and partners can update invites" ON team_invites
  FOR UPDATE USING (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')))
  WITH CHECK (firm_id IN (SELECT tm.firm_id FROM get_my_team_memberships() tm WHERE tm.role IN ('owner','partner')));


-- 4. Drop and recreate clients policies
DROP POLICY IF EXISTS "Team can view assigned clients" ON clients;
CREATE POLICY "Team can view assigned clients" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = clients.ca_id AND (tm.role IN ('owner','partner') OR clients.assigned_to = tm.id))
  );

DROP POLICY IF EXISTS "Team can update assigned clients" ON clients;
CREATE POLICY "Team can update assigned clients" ON clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = clients.ca_id AND (tm.role IN ('owner','partner') OR clients.assigned_to = tm.id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = ca_id AND (tm.role IN ('owner','partner') OR clients.assigned_to = tm.id))
  );

DROP POLICY IF EXISTS "Owners and partners can insert clients" ON clients;
CREATE POLICY "Owners and partners can insert clients" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = ca_id AND tm.role IN ('owner','partner'))
  );

DROP POLICY IF EXISTS "Owners and partners can delete clients" ON clients;
CREATE POLICY "Owners and partners can delete clients" ON clients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = clients.ca_id AND tm.role IN ('owner','partner'))
  );


-- 5. Drop and recreate downstream table policies
-- client_financials
DROP POLICY IF EXISTS "Team can manage financials for assigned clients" ON client_financials;
CREATE POLICY "Team can manage financials for assigned clients" ON client_financials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = client_financials.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = client_financials.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- reports
DROP POLICY IF EXISTS "Team can manage reports for assigned clients" ON reports;
CREATE POLICY "Team can manage reports for assigned clients" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = reports.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = reports.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- document_request_lists
DROP POLICY IF EXISTS "Team can manage document request lists for assigned clients" ON document_request_lists;
CREATE POLICY "Team can manage document request lists for assigned clients" ON document_request_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = document_request_lists.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = document_request_lists.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- document_request_items
DROP POLICY IF EXISTS "Team can manage document request items for assigned clients" ON document_request_items;
CREATE POLICY "Team can manage document request items for assigned clients" ON document_request_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_request_lists
      JOIN clients ON clients.id = document_request_lists.client_id
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE document_request_lists.id = document_request_items.list_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_request_lists
      JOIN clients ON clients.id = document_request_lists.client_id
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE document_request_lists.id = document_request_items.list_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );

-- document_request_templates
DROP POLICY IF EXISTS "Team can manage firm templates" ON document_request_templates;
CREATE POLICY "Team can manage firm templates" ON document_request_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = document_request_templates.ca_id)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM get_my_team_memberships() tm WHERE tm.firm_id = ca_id)
  );

-- document_request_template_items
DROP POLICY IF EXISTS "Team can manage firm template items" ON document_request_template_items;
CREATE POLICY "Team can manage firm template items" ON document_request_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_request_templates
      JOIN get_my_team_memberships() tm ON tm.firm_id = document_request_templates.ca_id
      WHERE document_request_templates.id = document_request_template_items.template_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_request_templates
      JOIN get_my_team_memberships() tm ON tm.firm_id = document_request_templates.ca_id
      WHERE document_request_templates.id = document_request_template_items.template_id
    )
  );

-- client_timeline_events
DROP POLICY IF EXISTS "Team can manage timeline events for assigned clients" ON client_timeline_events;
CREATE POLICY "Team can manage timeline events for assigned clients" ON client_timeline_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = client_timeline_events.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      JOIN get_my_team_memberships() tm ON tm.firm_id = clients.ca_id
      WHERE clients.id = client_timeline_events.client_id
        AND (tm.role IN ('owner', 'partner') OR clients.assigned_to = tm.id)
    )
  );
