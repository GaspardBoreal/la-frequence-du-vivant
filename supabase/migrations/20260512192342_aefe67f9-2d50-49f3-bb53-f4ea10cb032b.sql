-- Seed: Marche du Vivant V. Levavasseur (Tinchebray-Bocage, Normandie)
-- 1 exploration + 1 event + 7 marches (1 par habitat) + liaisons
WITH new_expl AS (
  INSERT INTO public.explorations (slug, name, description, language, published)
  VALUES (
    'laboratoire-ciel-ouvert-levavasseur',
    'Laboratoire à Ciel Ouvert : Biodiversité & Sols Vivants',
    '7 habitats contrastés sur ~35 ha — diagnostic biodiversité d''une mosaïque agroécologique avec Vincent Levavasseur (Ver de Terre Production, Vice-président du Conseil National de l''Agroécologie). Tinchebray-Bocage (Orne, Normandie).',
    'fr',
    false
  )
  RETURNING id
),
new_event AS (
  INSERT INTO public.marche_events (title, description, date_marche, lieu, latitude, longitude, event_type, exploration_id)
  SELECT
    'Laboratoire à Ciel Ouvert : Biodiversité & Sols Vivants',
    'Marche du Vivant accueillant Vincent Levavasseur (Président de Ver de Terre Production, Vice-président du Conseil National de l''Agroécologie). Diagnostic biodiversité sur 7 habitats contrastés.',
    '2026-05-12 10:00:00+02'::timestamptz,
    'Tinchebray-Bocage (61), Normandie',
    48.8257, -0.0146,
    'agroecologique',
    id
  FROM new_expl
  RETURNING id
),
new_marches AS (
  INSERT INTO public.marches (nom_marche, ville, region, departement, latitude, longitude, coordonnees, date, theme_principal, sous_themes, descriptif_court, organisateur_id)
  VALUES
    ('V. Levavasseur — Ripisylve',           'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82799, -0.01393, point(-0.01393, 48.82799), '2026-05-12', 'agroecologique', ARRAY['Ripisylve'],            'Habitat : Ripisylve — parcelle de la Marche V. Levavasseur',            'c64c5dde-5a9e-4505-8aff-97bebedf3dcc'),
    ('V. Levavasseur — Lisière forêt champ', 'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82405, -0.01187, point(-0.01187, 48.82405), '2026-05-12', 'agroecologique', ARRAY['Lisière forêt champ'],  'Habitat : Lisière forêt / champ — parcelle de la Marche V. Levavasseur', 'c64c5dde-5a9e-4505-8aff-97bebedf3dcc'),
    ('V. Levavasseur — Champ ouvert',        'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82644, -0.00928, point(-0.00928, 48.82644), '2026-05-12', 'agroecologique', ARRAY['Champ ouvert'],         'Habitat : Champ ouvert — parcelle de la Marche V. Levavasseur',         'c64c5dde-5a9e-4505-8aff-97bebedf3dcc'),
    ('V. Levavasseur — Lande sèche',         'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82434, -0.01680, point(-0.01680, 48.82434), '2026-05-12', 'agroecologique', ARRAY['Lande sèche'],          'Habitat : Lande sèche — parcelle de la Marche V. Levavasseur',          'c64c5dde-5a9e-4505-8aff-97bebedf3dcc'),
    ('V. Levavasseur — Prairie humide',      'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82570, -0.01679, point(-0.01679, 48.82570), '2026-05-12', 'agroecologique', ARRAY['Prairie humide'],       'Habitat : Prairie humide — parcelle de la Marche V. Levavasseur',       'c64c5dde-5a9e-4505-8aff-97bebedf3dcc'),
    ('V. Levavasseur — Potager sol vivant',  'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82631, -0.01742, point(-0.01742, 48.82631), '2026-05-12', 'agroecologique', ARRAY['Potager sol vivant'],   'Habitat : Potager sol vivant — parcelle de la Marche V. Levavasseur',   'c64c5dde-5a9e-4505-8aff-97bebedf3dcc'),
    ('V. Levavasseur — Forêt',               'Tinchebray-Bocage', 'Normandie', 'Orne', 48.82519, -0.01592, point(-0.01592, 48.82519), '2026-05-12', 'agroecologique', ARRAY['Forêt'],                'Habitat : Forêt — parcelle de la Marche V. Levavasseur',                'c64c5dde-5a9e-4505-8aff-97bebedf3dcc')
  RETURNING id, nom_marche
),
ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nom_marche) AS ord FROM new_marches
)
INSERT INTO public.exploration_marches (exploration_id, marche_id, ordre, publication_status)
SELECT (SELECT id FROM new_expl), o.id, o.ord, 'published_public'
FROM ordered o;