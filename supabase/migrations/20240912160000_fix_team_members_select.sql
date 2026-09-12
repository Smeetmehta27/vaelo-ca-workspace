-- Fix infinite recursion / chicken-and-egg problem in team_members SELECT policy
DROP POLICY IF EXISTS "Team members can view firm roster" ON team_members;

CREATE POLICY "Team members can view firm roster" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.firm_id = team_members.firm_id AND tm.user_id = auth.uid())
  );
