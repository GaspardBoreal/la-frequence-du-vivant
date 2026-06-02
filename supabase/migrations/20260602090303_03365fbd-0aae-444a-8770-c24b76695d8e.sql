INSERT INTO public.user_roles (user_id, role)
VALUES ('7a5cc1a2-301c-4070-ae62-248558ce0eec', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;