// Edge function: géolocalise les crm_companies sans latitude/longitude via la BAN
import { validateAuth, corsHeaders, createServiceClient, forbiddenResponse } from '../_shared/auth-helper.ts';

const BAN = 'https://api-adresse.data.gouv.fr/search';

interface Payload { company_ids?: string[] }

async function geocode(addr: string, postal: string, ville: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const tryQuery = async (q: string, type?: string) => {
    const url = `${BAN}/?q=${encodeURIComponent(q)}&limit=1${type ? `&type=${type}` : ''}`;
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) return null;
      const j = await r.json();
      const f = j?.features?.[0];
      if (!f) return null;
      const [lng, lat] = f.geometry?.coordinates ?? [];
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      return { lat, lng };
    } catch { return null; }
  };

  if (addr || postal || ville) {
    const full = [addr, postal, ville].filter(Boolean).join(' ').trim();
    if (full) {
      const r = await tryQuery(full);
      if (r) return { ...r, source: 'ban_address' };
    }
  }
  if (postal || ville) {
    const fb = [postal, ville].filter(Boolean).join(' ').trim();
    if (fb) {
      const r = await tryQuery(fb, 'municipality');
      if (r) return { ...r, source: 'ban_municipality' };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    if (!isAdmin) return forbiddenResponse();

    const body = (await req.json().catch(() => ({}))) as Payload;
    const service = createServiceClient();

    let query = service
      .from('crm_companies')
      .select('id, siren, adresse, code_postal, ville, latitude, longitude');

    if (Array.isArray(body.company_ids) && body.company_ids.length > 0) {
      query = query.in('id', body.company_ids);
    }
    query = query.or('latitude.is.null,longitude.is.null');

    const { data: companies, error } = await query.limit(500);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let updated = 0;
    let failed = 0;
    const details: Array<{ siren: string; status: string; source?: string }> = [];

    for (const c of companies ?? []) {
      const res = await geocode(c.adresse ?? '', c.code_postal ?? '', c.ville ?? '');
      if (!res) {
        failed++;
        details.push({ siren: c.siren, status: 'failed' });
        continue;
      }
      const { error: upErr } = await service
        .from('crm_companies')
        .update({ latitude: res.lat, longitude: res.lng })
        .eq('id', c.id);
      if (upErr) {
        failed++;
        details.push({ siren: c.siren, status: 'update_error' });
      } else {
        updated++;
        details.push({ siren: c.siren, status: 'updated', source: res.source });
      }
    }

    return new Response(JSON.stringify({ updated, failed, total: companies?.length ?? 0, details }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
