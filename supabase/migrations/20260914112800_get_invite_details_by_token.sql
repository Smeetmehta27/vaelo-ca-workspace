CREATE OR REPLACE FUNCTION public.get_invite_details_by_token(token uuid)
RETURNS TABLE (
    firm_name text,
    role text,
    email text,
    valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite public.team_invites%ROWTYPE;
    v_firm_name text;
BEGIN
    -- Look up the invite securely, bypassing RLS since team_invites are protected
    SELECT * INTO v_invite
    FROM public.team_invites
    WHERE access_token = token;

    -- If found and not expired and not accepted, it is valid
    IF FOUND AND v_invite.expires_at > now() AND v_invite.accepted_at IS NULL THEN
        -- Get the firm's name
        SELECT name INTO v_firm_name
        FROM public.ca_profiles
        WHERE id = v_invite.firm_id;

        RETURN QUERY SELECT
            v_firm_name,
            v_invite.role,
            v_invite.email,
            true;
    ELSE
        -- Return only that it's invalid, nothing else
        RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, false;
    END IF;
END;
$$;
