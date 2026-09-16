INSERT INTO public.site_pages (path, title, subtitle, univers, keywords, priority, featured)
VALUES (
  '/innovation-robot',
  'Robotique frugale : capteurs d’abord, robots ensuite',
  'Solutions, budgets et plan d’action pour jardins, marches et vignobles',
  'vivant',
  ARRAY[
    'robotique frugale', 'robot', 'capteur', 'biodiversité', 'sol', 'jardin',
    'marche', 'vignoble', 'viticulture', 'drone', 'audiomoth', 'farmbot',
    'vitirover', 'open source', 'lerobot', 'asimov'
  ],
  82,
  true
)
ON CONFLICT (path) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  univers = EXCLUDED.univers,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  featured = EXCLUDED.featured,
  is_active = true,
  updated_at = now();