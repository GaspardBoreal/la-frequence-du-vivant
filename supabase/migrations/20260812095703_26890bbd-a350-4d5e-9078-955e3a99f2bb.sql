create or replace function public.get_iot_trust_report(p_since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with d as (
  select * from public.iot_webhook_deliveries
  where fournisseur = 'brad' and created_at >= p_since
),
known as (
  select d.* from d where d.capteur_id is not null
),
tests as (
  select d.* from d where d.capteur_id is null
),
caps as (
  select c.id, c.nom, c.serial_number, c.last_seen_at, c.battery_pct, c.rssi
  from public.iot_capteurs c
  where c.id in (select distinct capteur_id from known)
     or c.serial_number in ('b26s001','b26s002','b26s003')
),
per_cap as (
  select
    c.id, c.nom, c.serial_number, c.last_seen_at, c.battery_pct, c.rssi,
    (select count(*) from known k where k.capteur_id = c.id) as livraisons,
    (select count(*) from known k where k.capteur_id = c.id and coalesce(k.mesures_count,0) > 0) as livraisons_utiles,
    (select count(*) from public.iot_mesures m where m.capteur_id = c.id and m.mesure_at >= p_since) as mesures,
    (select max(m.mesure_at) from public.iot_mesures m where m.capteur_id = c.id) as derniere_mesure,
    (select count(*) from public.iot_mesures m where m.capteur_id = c.id and m.mesure_at >= p_since and m.grandeur = 'soil_moisture') as mesures_humidite_sol,
    (select count(*) from public.iot_mesures m where m.capteur_id = c.id and m.mesure_at >= p_since and m.profondeur_m is not null) as mesures_avec_profondeur
  from caps c
),
grandeurs as (
  select m.grandeur,
         count(*) as n,
         min(m.unite) as unite,
         max(m.mesure_at) as derniere,
         count(*) filter (where m.profondeur_m is not null) as avec_profondeur
  from public.iot_mesures m
  where m.mesure_at >= p_since
    and m.capteur_id in (select id from caps)
  group by m.grandeur
),
batt as (
  select
    count(*) filter (where (k.payload #>> '{probe,batteryPercentage}') is not null) as n_batt,
    count(*) filter (where (k.payload #>> '{probe,batteryPercentage}')::numeric > 0) as n_batt_pos,
    max(nullif((k.payload #>> '{probe,batteryPercentage}'), '')::numeric) as batt_max,
    max(k.created_at) filter (where (k.payload #>> '{probe,batteryPercentage}')::numeric > 0) as batt_ok_at
  from known k
)
select jsonb_build_object(
  'since', p_since,
  'generated_at', now(),
  'fenetre_minutes', greatest(1, round(extract(epoch from (now() - p_since)) / 60)::int),
  'livraisons_total', (select count(*) from d),
  'livraisons_valides', (select count(*) from d where signature_valid),
  'livraisons_refusees', (select count(*) from d where signature_valid is not true),
  'livraisons_vides', (select count(*) from known where signature_valid and coalesce(mesures_count,0) = 0),
  'livraisons_utiles', (select count(*) from known where signature_valid and coalesce(mesures_count,0) > 0),
  'livraisons_essais', (select count(*) from tests),
  'erreurs_applicatives', (select count(*) from known where error is not null),
  'mesures_total', (select count(*) from public.iot_mesures m where m.mesure_at >= p_since and m.capteur_id in (select id from caps)),
  'sondes', coalesce((select jsonb_agg(to_jsonb(p) order by p.nom) from per_cap p), '[]'::jsonb),
  'grandeurs', coalesce((select jsonb_agg(to_jsonb(g) order by g.grandeur) from grandeurs g), '[]'::jsonb),
  'batterie', (select to_jsonb(b) from batt b)
);
$$;

revoke all on function public.get_iot_trust_report(timestamptz) from public;
grant execute on function public.get_iot_trust_report(timestamptz) to anon, authenticated, service_role;