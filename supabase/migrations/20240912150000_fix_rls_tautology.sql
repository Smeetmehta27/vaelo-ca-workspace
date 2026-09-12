-- Fix tautology in team_members INSERT
DROP POLICY IF EXISTS "Owners and partners can insert team members" ON team_members;
CREATE POLICY "Owners and partners can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

-- Fix tautology in team_members UPDATE
DROP POLICY IF EXISTS "Owners and partners can update team members" ON team_members;
CREATE POLICY "Owners and partners can update team members" ON team_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

-- Fix tautology in team_invites INSERT
DROP POLICY IF EXISTS "Owners and partners can insert invites" ON team_invites;
CREATE POLICY "Owners and partners can insert invites" ON team_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_invites.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );

-- Fix tautology in team_invites UPDATE
DROP POLICY IF EXISTS "Owners and partners can update invites" ON team_invites;
CREATE POLICY "Owners and partners can update invites" ON team_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_invites.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_invites.firm_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','partner'))
  );
