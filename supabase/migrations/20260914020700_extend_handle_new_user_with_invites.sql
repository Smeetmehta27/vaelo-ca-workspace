CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invite_token uuid;
  v_invite_record record;
BEGIN
  -- Always create the ca_profile for the new user
  INSERT INTO public.ca_profiles (id)
  VALUES (new.id);

  -- Attempt to parse the invite token from metadata
  BEGIN
    v_invite_token := (new.raw_user_meta_data->>'invite_token')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_invite_token := NULL;
  END;

  IF v_invite_token IS NULL THEN
    -- Default behavior: Create new firm context with this user as the owner
    INSERT INTO public.team_members (firm_id, user_id, role)
    VALUES (new.id, new.id, 'owner');
  ELSE
    -- Invite behavior: Look up the invite token
    SELECT * INTO v_invite_record 
    FROM public.team_invites 
    WHERE access_token = v_invite_token;

    -- Validate the invite
    IF NOT FOUND 
       OR v_invite_record.expires_at <= now() 
       OR v_invite_record.accepted_at IS NOT NULL 
       OR lower(v_invite_record.email) != lower(new.email) THEN
      RAISE EXCEPTION 'INVALID_INVITE: token not found, expired, already used, or email mismatch';
    END IF;

    -- Join the existing firm
    INSERT INTO public.team_members (firm_id, user_id, role)
    VALUES (v_invite_record.firm_id, new.id, v_invite_record.role);

    -- Mark invite as accepted
    UPDATE public.team_invites
    SET accepted_at = now()
    WHERE id = v_invite_record.id;
  END IF;

  RETURN new;
END;
$function$;
