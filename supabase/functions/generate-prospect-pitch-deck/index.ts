// Generate Prospect Pitch Deck — Levier 1 « Dossier Preuve par la Data »
//
// Input:  POST { deck_id: uuid }
// Effect: Génère un PDF commercial (cover + KPIs + top espèces + témoignages + CTA)
//         à partir d'une marche passée, l'uploade dans le bucket pack-vivant sous
//         prospect-decks/{deck_id}.pdf et met à jour crm_prospect_decks.
//
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeckSections {
  cover?: boolean;
  kpis?: boolean;
  top_species?: boolean;
  testimonies?: boolean;
  hero_photo?: boolean;
  cta?: boolean;
}

const FOREST = rgb(0.05, 0.42, 0.34);
const INK = rgb(0.08, 0.1, 0.12);
const MUTED = rgb(0.45, 0.45, 0.45);
const CREAM = rgb(0.98, 0.97, 0.93);

function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return ''; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Auth: admin only ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc('is_admin_user' as any).single?.() ??
      await admin.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    if (!isAdmin) {
      // fallback: check admin_users
      const { data: au } = await admin.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
      if (!au) {
        return new Response(JSON.stringify({ error: 'forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const deckId: string | undefined = body?.deck_id;
    if (!deckId) {
      return new Response(JSON.stringify({ error: 'deck_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Load deck row ---
    const { data: deck, error: deckErr } = await admin
      .from('crm_prospect_decks')
      .select('id, company_id, marche_id, sections, status')
      .eq('id', deckId)
      .maybeSingle();
    if (deckErr || !deck) {
      return new Response(JSON.stringify({ error: 'deck not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('crm_prospect_decks')
      .update({ status: 'generating', error: null })
      .eq('id', deckId);

    const sections: DeckSections = (deck.sections as any) ?? {
      cover: true, kpis: true, top_species: true, testimonies: true, hero_photo: true, cta: true,
    };

    // --- Load company + marche ---
    const [{ data: company }, { data: marche }] = await Promise.all([
      admin.from('crm_companies')
        .select('id, denomination, nom_complet, ville, region, code_naf, libelle_naf, site_web')
        .eq('id', deck.company_id).maybeSingle(),
      admin.from('marche_events')
        .select('id, title, description, date_marche, lieu, cover_image_url, public_slug, exploration_id')
        .eq('id', deck.marche_id).maybeSingle(),
    ]);
    if (!company || !marche) throw new Error('company or marche missing');

    // --- KPIs ---
    const [participantsRes, observationsRes, testimoniesRes] = await Promise.all([
      admin.from('marche_participations').select('id', { count: 'exact', head: true })
        .eq('marche_id', marche.id),
      admin.from('marcheur_observations')
        .select('scientific_name, common_name_fr, photo_url, observation_date')
        .eq('marche_id', marche.id)
        .order('observation_date', { ascending: false })
        .limit(200),
      admin.from('event_testimonies')
        .select('author_name, quote')
        .eq('event_id', marche.id)
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .limit(4),
    ]);

    const participantsCount = participantsRes.count ?? 0;
    const observations = observationsRes.data ?? [];
    const testimonies = testimoniesRes.data ?? [];

    // Aggregate top species
    const speciesMap = new Map<string, { sci: string; fr: string | null; count: number; photo: string | null }>();
    for (const o of observations) {
      const key = (o.scientific_name || '').toLowerCase();
      if (!key) continue;
      const ex = speciesMap.get(key);
      if (ex) {
        ex.count += 1;
        if (!ex.photo && o.photo_url) ex.photo = o.photo_url;
      } else {
        speciesMap.set(key, {
          sci: o.scientific_name, fr: o.common_name_fr,
          count: 1, photo: o.photo_url,
        });
      }
    }
    const topSpecies = [...speciesMap.values()]
      .sort((a, b) => b.count - a.count).slice(0, 8);
    const totalSpecies = speciesMap.size;

    // --- Build PDF ---
    const pdf = await PDFDocument.create();
    const fontReg = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const W = 595.28, H = 841.89; // A4
    const M = 56;

    // ===== Cover page =====
    if (sections.cover !== false) {
      const page = pdf.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
      page.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: FOREST });

      let y = H - 140;
      page.drawText('DOSSIER PREUVE', { x: M, y, size: 11, font: fontBold, color: FOREST });
      y -= 14;
      page.drawText('par la donnée vivante', { x: M, y, size: 11, font: fontItalic, color: MUTED });

      y -= 60;
      const title = company.denomination || company.nom_complet || 'Prospect';
      for (const ln of wrap(`Une preuve concrète pour ${title}`, fontBold, 28, W - M * 2)) {
        page.drawText(ln, { x: M, y, size: 28, font: fontBold, color: INK });
        y -= 34;
      }

      y -= 24;
      page.drawText(`Marche : ${marche.title}`, { x: M, y, size: 13, font: fontBold, color: INK });
      y -= 18;
      page.drawText(
        [fmtDate(marche.date_marche), marche.lieu].filter(Boolean).join(' • '),
        { x: M, y, size: 11, font: fontReg, color: MUTED },
      );

      // Footer
      page.drawText('La Fréquence du Vivant', {
        x: M, y: 50, size: 10, font: fontBold, color: FOREST,
      });
      page.drawText(fmtDate(new Date().toISOString()), {
        x: W - M - 100, y: 50, size: 10, font: fontReg, color: MUTED,
      });
    }

    // ===== KPIs + description =====
    if (sections.kpis !== false) {
      const page = pdf.addPage([W, H]);
      let y = H - M;
      page.drawText('Ce que cette marche a produit', { x: M, y, size: 18, font: fontBold, color: FOREST });
      y -= 36;

      const kpis = [
        { label: 'Participants engagés', value: String(participantsCount) },
        { label: 'Espèces observées', value: String(totalSpecies) },
        { label: 'Observations collectées', value: String(observations.length) },
        { label: 'Témoignages recueillis', value: String(testimonies.length) },
      ];
      const cardW = (W - M * 2 - 16) / 2;
      const cardH = 80;
      for (let i = 0; i < kpis.length; i++) {
        const col = i % 2, row = Math.floor(i / 2);
        const x = M + col * (cardW + 16);
        const cy = y - row * (cardH + 16) - cardH;
        page.drawRectangle({
          x, y: cy, width: cardW, height: cardH,
          color: rgb(1, 1, 1), borderColor: FOREST, borderWidth: 1.2,
        });
        page.drawText(kpis[i].value, { x: x + 16, y: cy + cardH - 38, size: 28, font: fontBold, color: FOREST });
        page.drawText(kpis[i].label, { x: x + 16, y: cy + 16, size: 11, font: fontReg, color: MUTED });
      }
      y -= cardH * 2 + 32;

      if (marche.description) {
        y -= 12;
        page.drawText('Contexte', { x: M, y, size: 13, font: fontBold, color: INK });
        y -= 18;
        for (const ln of wrap(marche.description.slice(0, 800), fontReg, 11, W - M * 2)) {
          if (y < 80) break;
          page.drawText(ln, { x: M, y, size: 11, font: fontReg, color: INK });
          y -= 16;
        }
      }
    }

    // ===== Top species =====
    if (sections.top_species !== false && topSpecies.length) {
      const page = pdf.addPage([W, H]);
      let y = H - M;
      page.drawText('Patrimoine vivant révélé', { x: M, y, size: 18, font: fontBold, color: FOREST });
      y -= 12;
      page.drawText('Top espèces les plus observées par les marcheurs', {
        x: M, y, size: 10, font: fontItalic, color: MUTED,
      });
      y -= 28;

      for (const sp of topSpecies) {
        if (y < 100) break;
        page.drawRectangle({
          x: M, y: y - 48, width: W - M * 2, height: 48,
          color: rgb(0.985, 0.98, 0.94),
        });
        page.drawText(sp.fr || sp.sci, {
          x: M + 14, y: y - 22, size: 13, font: fontBold, color: INK,
        });
        if (sp.fr) {
          page.drawText(sp.sci, {
            x: M + 14, y: y - 38, size: 9, font: fontItalic, color: MUTED,
          });
        }
        page.drawText(`${sp.count} obs.`, {
          x: W - M - 70, y: y - 30, size: 12, font: fontBold, color: FOREST,
        });
        y -= 56;
      }
    }

    // ===== Témoignages =====
    if (sections.testimonies !== false && testimonies.length) {
      const page = pdf.addPage([W, H]);
      let y = H - M;
      page.drawText('Ce qu\u2019ils en disent', { x: M, y, size: 18, font: fontBold, color: FOREST });
      y -= 30;

      for (const t of testimonies) {
        if (y < 140) break;
        page.drawText('\u201C', { x: M, y: y - 4, size: 32, font: fontBold, color: FOREST });
        const lines = wrap(t.quote || '', fontItalic, 12, W - M * 2 - 30);
        let ty = y - 16;
        for (const ln of lines.slice(0, 6)) {
          page.drawText(ln, { x: M + 24, y: ty, size: 12, font: fontItalic, color: INK });
          ty -= 16;
        }
        page.drawText(`— ${t.author_name || 'Un\u00b7e marcheur\u00b7se'}`, {
          x: M + 24, y: ty - 4, size: 10, font: fontBold, color: MUTED,
        });
        y = ty - 32;
      }
    }

    // ===== CTA =====
    if (sections.cta !== false) {
      const page = pdf.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: FOREST });
      let y = H - 160;
      page.drawText('Et si nous révélions', { x: M, y, size: 28, font: fontBold, color: CREAM });
      y -= 36;
      page.drawText(`votre territoire vivant ?`, { x: M, y, size: 28, font: fontBold, color: CREAM });
      y -= 60;
      const pitch = [
        `${company.denomination || company.nom_complet || ''} pourrait, comme cette marche,`,
        `engager ses équipes et ses parties prenantes autour d\u2019un patrimoine`,
        `vivant cartographié, raconté, et partagé en données ouvertes.`,
      ];
      for (const ln of pitch) {
        page.drawText(ln, { x: M, y, size: 13, font: fontReg, color: CREAM });
        y -= 20;
      }
      y -= 40;
      page.drawText('Contact', { x: M, y, size: 11, font: fontBold, color: CREAM });
      y -= 16;
      page.drawText('La Fréquence du Vivant', { x: M, y, size: 12, font: fontReg, color: CREAM });
      y -= 16;
      page.drawText('la-frequence-du-vivant.com', { x: M, y, size: 12, font: fontReg, color: CREAM });
    }

    const pdfBytes = await pdf.save();

    // --- Upload (reuse pack-vivant bucket, service-role-only) ---
    const storagePath = `prospect-decks/${deck.id}.pdf`;
    const { error: upErr } = await admin.storage.from('pack-vivant')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (upErr) throw upErr;

    const { data: signed, error: signErr } = await admin.storage
      .from('pack-vivant')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 jours
    if (signErr) throw signErr;

    const populatedSections = {
      ...sections,
      _meta: {
        participants: participantsCount,
        species: totalSpecies,
        observations: observations.length,
        testimonies: testimonies.length,
        generated_at: new Date().toISOString(),
      },
    };

    await admin.from('crm_prospect_decks').update({
      status: 'ready',
      file_url: signed!.signedUrl,
      sections: populatedSections,
      error: null,
    }).eq('id', deck.id);

    return new Response(JSON.stringify({
      ok: true,
      deck_id: deck.id,
      file_url: signed!.signedUrl,
      meta: populatedSections._meta,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-prospect-pitch-deck error', e);
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const body = await req.clone().json().catch(() => ({}));
      if (body?.deck_id) {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
        await admin.from('crm_prospect_decks').update({
          status: 'error', error: String((e as any)?.message ?? e),
        }).eq('id', body.deck_id);
      }
    } catch { /* noop */ }
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
