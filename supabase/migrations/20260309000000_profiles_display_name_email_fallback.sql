-- Use email as fallback when full_name is not set on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
      SPLIT_PART(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$;

-- Backfill existing profiles that have null display_name
UPDATE public.profiles p
SET display_name = SPLIT_PART(u.email, '@', 1)
FROM auth.users u
WHERE p.id = u.id
  AND (p.display_name IS NULL OR TRIM(p.display_name) = '');
