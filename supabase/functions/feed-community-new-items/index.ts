// Feed « Nouveautés de la communauté » pour l'accueil mon-espace
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type FeedKind = 'photo' | 'son' | 'texte' | 'espece';

interface FeedItem {
  id: string;              // unique carousel key: `${kind}:${sourceId}`
  kind: FeedKind;
  sourceId: string;
  createdAt: string;
  title: string | null;
  preview: string | null;       // url image / thumb / snippet
  extra?: Record<string, unknown>;
  author: {
    userId: string | null;
    prenom: string | null;
    nom: string | null;
    avatarUrl: string | null;
  };
  marche: {
    eventId: string | null;
    title: string | null;
    explorationId: string | null;
    publicSlug: string | null;
    dateMarche: string | null;
  };
  registered: boolean;
}

const stripHtml = (s: string | null | undefined) =>
  (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: claims, error: cErr } = await anon.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    // 1. Marches de l'utilisateur
    const { data: parts } = await sb
      .from('marche_participations')
      .select('marche_event_id')
      .eq('user_id', userId);
    const registeredIds = new Set<string>((parts || []).map((p: any) => p.marche_event_id));

    // 2. Items déjà vus/cliqués
    const { data: seen } = await sb
      .from('marcheur_activity_logs')
      .select('event_target')
      .eq('user_id', userId)
      .in('event_type', ['feed_seen', 'feed_clicked'])
      .gte('created_at', since);
    const seenSet = new Set<string>((seen || []).map((r: any) => r.event_target));

    // 3. Requêtes parallèles
    const [photosR, audioR, textesR, obsR] = await Promise.all([
      sb.from('marcheur_medias')
        .select('id, user_id, marche_event_id, url_fichier, external_url, titre, description, created_at, type_media, is_public')
        .eq('type_media', 'photo')
        .neq('user_id', userId)
        .gte('created_at', since)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(60),
      sb.from('marcheur_audio')
        .select('id, user_id, marche_event_id, url_fichier, titre, description, duree_secondes, created_at, is_public')
        .neq('user_id', userId)
        .gte('created_at', since)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30),
      sb.from('marcheur_textes')
        .select('id, user_id, marche_event_id, titre, contenu, type_texte, created_at, is_public')
        .neq('user_id', userId)
        .gte('created_at', since)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30),
      sb.from('marcheur_observations')
        .select('id, marcheur_id, marche_id, species_scientific_name, taxon_common_name_fr, photo_url, kingdom, iconic_taxon, created_at, observation_date')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(80),
    ]);

    // 4. Résoudre marche_events → title, exploration_id, public_slug
    const eventIds = new Set<string>();
    [photosR.data, audioR.data, textesR.data].forEach(arr =>
      (arr || []).forEach((r: any) => r.marche_event_id && eventIds.add(r.marche_event_id))
    );

    // Pour observations : marche_id → exploration_id → un marche_event_id
    const obsMarcheIds = Array.from(new Set((obsR.data || []).map((o: any) => o.marche_id).filter(Boolean)));
    let marcheToEvent: Record<string, { eventId: string; title: string; explorationId: string | null; publicSlug: string | null; dateMarche: string | null }> = {};
    if (obsMarcheIds.length) {
      const { data: em } = await sb
        .from('exploration_marches')
        .select('marche_id, exploration_id')
        .in('marche_id', obsMarcheIds);
      const explorationIds = Array.from(new Set((em || []).map((r: any) => r.exploration_id)));
      const { data: evs } = explorationIds.length
        ? await sb.from('marche_events')
            .select('id, title, exploration_id, public_slug, date_marche')
            .in('exploration_id', explorationIds)
            .order('date_marche', { ascending: false })
        : { data: [] as any[] };
      const explToEvent = new Map<string, any>();
      (evs || []).forEach((e: any) => { if (!explToEvent.has(e.exploration_id)) explToEvent.set(e.exploration_id, e); });
      (em || []).forEach((r: any) => {
        const ev = explToEvent.get(r.exploration_id);
        if (ev) {
          marcheToEvent[r.marche_id] = {
            eventId: ev.id,
            title: ev.title,
            explorationId: ev.exploration_id,
            publicSlug: ev.public_slug,
            dateMarche: ev.date_marche,
          };
          eventIds.add(ev.id);
        }
      });
    }

    const { data: eventRows } = eventIds.size
      ? await sb.from('marche_events')
          .select('id, title, exploration_id, public_slug, date_marche')
          .in('id', Array.from(eventIds))
      : { data: [] as any[] };
    const eventMap = new Map<string, any>();
    (eventRows || []).forEach((e: any) => eventMap.set(e.id, e));

    // 5. Auteurs (community_profiles)
    const authorUserIds = new Set<string>();
    [photosR.data, audioR.data, textesR.data].forEach(arr =>
      (arr || []).forEach((r: any) => r.user_id && authorUserIds.add(r.user_id))
    );
    const { data: profiles } = authorUserIds.size
      ? await sb.from('community_profiles')
          .select('user_id, prenom, nom, avatar_url')
          .in('user_id', Array.from(authorUserIds))
      : { data: [] as any[] };
    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

    // Auteurs pour observations via exploration_marcheurs
    const obsMarcheurIds = Array.from(new Set((obsR.data || []).map((o: any) => o.marcheur_id).filter(Boolean)));
    const { data: marcheurRows } = obsMarcheurIds.length
      ? await sb.from('exploration_marcheurs')
          .select('id, user_id, prenom, nom, avatar_url')
          .in('id', obsMarcheurIds)
      : { data: [] as any[] };
    const marcheurMap = new Map<string, any>();
    (marcheurRows || []).forEach((m: any) => marcheurMap.set(m.id, m));

    // 6. Assembler
    const buildItem = (
      kind: FeedKind,
      sourceId: string,
      row: any,
      preview: string | null,
      title: string | null,
      eventId: string | null,
      author: { userId: string | null; prenom: string | null; nom: string | null; avatarUrl: string | null },
      extra: Record<string, unknown> = {},
    ): FeedItem | null => {
      const key = `${kind}:${sourceId}`;
      if (seenSet.has(key)) return null;
      // Exclusion : items de soi (déjà filtré côté requête pour la plupart)
      if (author.userId && author.userId === userId) return null;
      const ev = eventId ? eventMap.get(eventId) : null;
      return {
        id: key,
        kind,
        sourceId,
        createdAt: row.created_at,
        title,
        preview,
        extra,
        author,
        marche: {
          eventId,
          title: ev?.title ?? null,
          explorationId: ev?.exploration_id ?? null,
          publicSlug: ev?.public_slug ?? null,
          dateMarche: ev?.date_marche ?? null,
        },
        registered: eventId ? registeredIds.has(eventId) : false,
      };
    };

    const items: FeedItem[] = [];

    (photosR.data || []).forEach((r: any) => {
      const author = profileMap.get(r.user_id);
      const it = buildItem('photo', r.id, r,
        r.url_fichier || r.external_url || null,
        r.titre || r.description || null,
        r.marche_event_id,
        {
          userId: r.user_id,
          prenom: author?.prenom ?? null,
          nom: author?.nom ?? null,
          avatarUrl: author?.avatar_url ?? null,
        }
      );
      if (it) items.push(it);
    });

    (audioR.data || []).forEach((r: any) => {
      const author = profileMap.get(r.user_id);
      const it = buildItem('son', r.id, r,
        null,
        r.titre || r.description || null,
        r.marche_event_id,
        {
          userId: r.user_id,
          prenom: author?.prenom ?? null,
          nom: author?.nom ?? null,
          avatarUrl: author?.avatar_url ?? null,
        },
        { audioUrl: r.url_fichier, duree: r.duree_secondes },
      );
      if (it) items.push(it);
    });

    (textesR.data || []).forEach((r: any) => {
      const author = profileMap.get(r.user_id);
      const it = buildItem('texte', r.id, r,
        null,
        r.titre || null,
        r.marche_event_id,
        {
          userId: r.user_id,
          prenom: author?.prenom ?? null,
          nom: author?.nom ?? null,
          avatarUrl: author?.avatar_url ?? null,
        },
        { extrait: stripHtml(r.contenu), typeTexte: r.type_texte },
      );
      if (it) items.push(it);
    });

    // Espèces : dédupliquer par species_scientific_name+event
    const seenSpecies = new Set<string>();
    (obsR.data || []).forEach((o: any) => {
      const marcheInfo = marcheToEvent[o.marche_id];
      if (!marcheInfo) return;
      const marcheur = marcheurMap.get(o.marcheur_id);
      const authorUid = marcheur?.user_id || null;
      if (authorUid === userId) return;
      const dedupKey = `${o.species_scientific_name}::${marcheInfo.eventId}`;
      if (seenSpecies.has(dedupKey)) return;
      seenSpecies.add(dedupKey);
      const it = buildItem('espece', o.id, o,
        o.photo_url || null,
        o.taxon_common_name_fr || o.species_scientific_name,
        marcheInfo.eventId,
        {
          userId: authorUid,
          prenom: marcheur?.prenom ?? null,
          nom: marcheur?.nom ?? null,
          avatarUrl: marcheur?.avatar_url ?? null,
        },
        {
          scientificName: o.species_scientific_name,
          commonName: o.taxon_common_name_fr,
          kingdom: o.kingdom,
          iconicTaxon: o.iconic_taxon,
        },
      );
      if (it) items.push(it);
    });

    // 7. Split main/discovery + diversification par auteur
    const byRegistered = { main: [] as FeedItem[], discovery: [] as FeedItem[] };
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    for (const it of items) {
      const bucket = it.registered ? byRegistered.main : byRegistered.discovery;
      bucket.push(it);
    }

    // Diversification légère : max 4 items consécutifs du même auteur
    const diversify = (arr: FeedItem[]) => {
      const out: FeedItem[] = [];
      const authorCount = new Map<string, number>();
      for (const it of arr) {
        const k = it.author.userId || 'anon';
        const c = authorCount.get(k) || 0;
        if (c >= 6) continue;
        authorCount.set(k, c + 1);
        out.push(it);
      }
      return out;
    };

    return new Response(JSON.stringify({
      main: diversify(byRegistered.main).slice(0, 20),
      discovery: diversify(byRegistered.discovery).slice(0, 10),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[feed-community-new-items]', e);
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
