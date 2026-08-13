UPDATE auth.users
SET encrypted_password = extensions.crypt('Vivant-Marche-2026!', extensions.gen_salt('bf')),
    updated_at = now()
WHERE email = 'karki.laurence@gmail.com';