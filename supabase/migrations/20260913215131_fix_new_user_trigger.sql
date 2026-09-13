-- Update handle_new_user to also insert the user as an owner into team_members
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.ca_profiles (id)
  VALUES (new.id);

  INSERT INTO public.team_members (firm_id, user_id, role)
  VALUES (new.id, new.id, 'owner');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
