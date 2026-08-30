// Collecte horaire des mesures Weenat.
// Weenat ne pousse pas de webhook : on va chercher, propriété par propriété,
// les séries horaires de chaque capteur rattaché (appareil physique ou parcelle
// pour la station météo virtuelle), puis on les insère au vocabulaire interne.
//
// Appel possible : par un administrateur depuis l'admin IoT, ou par le cron
// avec la clé de service.
import { createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { fetchData, normalize } from '../_shared/weenat.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Cron (secret partagé ou clé de service), administrateur, ou gestionnaire de la propriété visée. */
async function authorize(req: Request, proprieteId?: string): Promise<boolean> {
  const cronSecret = Deno.env.get('CRON_SHARED_SECRET');
  const providedCron = req.headers.get('x-cron-secret');
  if (cronSecret && providedCron && providedCron === cronSecret) return true;

  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return true;


  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data } = await client.auth.getUser();
  if (!data?.user) return false;
  const { data: isAdmin } = await client.rpc('check_is_admin_user', { check_user_id: data.user.id });
  if (isAdmin) return true;

  // Sans droit d'administration, la collecte est possible uniquement pour une
  // propriété précise à laquelle la personne a accès.
  if (!proprieteId) return false;
  const { data: canAccess } = await client.rpc('can_access_propriete', { _propriete_id: proprieteId });
  return !!canAccess;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let body: { propriete_id?: string; hours?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!(await authorize(req, body.propriete_id))) return json({ error: 'Non autorisé' }, 403);
  const hours = Math.min(Math.max(Number(body.hours) || 6, 1), 24 * 30);


  const service = createServiceClient();

  const { data: fournisseur } = await service
    .from('iot_fournisseurs')
    .select('id')
    .ilike('nom', '%weenat%')
    .maybeSingle();
  if (!fournisseur) return json({ error: 'Fournisseur Weenat absent du catalogue' }, 404);

  let q = service
    .from('iot_propriete_integrations')
    .select('id, propriete_id, api_key, external_plot_id')
    .eq('fournisseur_id', fournisseur.id)
    .eq('actif', true);
  if (body.propriete_id) q = q.eq('propriete_id', body.propriete_id);

  const { data: integrations, error: intErr } = await q;
  if (intErr) return json({ error: intErr.message }, 500);
  if (!integrations?.length) return json({ ok: true, integrations: 0, inserted: 0, details: [] });

  const end = new Date();
  const start = new Date(end.getTime() - hours * 3600_000);
  const details: unknown[] = [];
  let inserted = 0;

  for (const integ of integrations) {
    const { data: capteurs } = await service
      .from('iot_capteurs')
      .select('id, nom, external_id, external_kind, type:iot_types_capteurs(fournisseur_id, profondeurs_m)')
      .eq('propriete_id', integ.propriete_id)
      .eq('actif', true);

    const mine = (capteurs ?? []).filter(
      (c: any) => c.external_id && c.type?.fournisseur_id === fournisseur.id,
    );

    let integInserted = 0;
    const errors: string[] = [];

    for (const capteur of mine as any[]) {
      try {
        const rows = await fetchData(
          integ.api_key,
          capteur.external_kind === 'plot' ? 'plot' : 'device',
          String(capteur.external_id),
          start,
          end,
        );
        const depths = (capteur.type?.profondeurs_m ?? []).map(Number).filter((n: number) => Number.isFinite(n));
        const { mesures, rejected } = normalize(rows, depths);
        if (!mesures.length) {
          details.push({ capteur: capteur.nom, points: 0, rejected });
          continue;
        }

        const payload = mesures.map((m) => ({
          capteur_id: capteur.id,
          grandeur: m.grandeur,
          valeur: m.valeur,
          unite: m.unite,
          profondeur_m: m.profondeur_m,
          mesure_at: m.mesure_at,
          source: 'weenat_pull',
        }));

        const { error: upErr } = await service
          .from('iot_mesures')
          .upsert(payload, { onConflict: 'capteur_id,grandeur,profondeur_m,mesure_at', ignoreDuplicates: true });
        if (upErr) throw new Error(upErr.message);

        const latest = mesures.reduce((a, b) => (a.mesure_at > b.mesure_at ? a : b)).mesure_at;
        await service.from('iot_capteurs').update({ last_seen_at: latest }).eq('id', capteur.id);

        integInserted += payload.length;
        details.push({ capteur: capteur.nom, points: payload.length, rejected });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[iot-pull-weenat]', capteur.nom, msg);
        errors.push(`${capteur.nom} : ${msg}`);
      }
    }

    inserted += integInserted;
    await service
      .from('iot_propriete_integrations')
      .update({
        last_pull_at: new Date().toISOString(),
        last_pull_status: errors.length
          ? `erreur — ${errors.slice(0, 3).join(' | ')}`
          : `ok — ${integInserted} mesures / ${mine.length} capteurs`,
      })
      .eq('id', integ.id);
  }

  return json({ ok: true, integrations: integrations.length, inserted, details });
});
