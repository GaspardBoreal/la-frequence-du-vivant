// Analyse IA des espèces d'une exploration — Référentiel cascade
// 1. Knowledge base local (src/data/species-knowledge-base.json) → confidence 1.0
// 2. IA avec citations OBLIGATOIRES → confidence 0.6-0.9
// Catégorisation : 1 principale + N secondaires + evidence[] auditable
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'google/gemini-3-flash-preview';
const MAX_SPECIES = 60;
const KB_VERSION = '2026.05.01';

// ─── Knowledge base locale (embed pour éviter import dynamique en Deno) ───
// Subset des espèces les plus fréquentes ; structure miroir de
// src/data/species-knowledge-base.json. Si le frontend ajoute une espèce
// au JSON, l'idéal est de redéployer cette function avec la mise à jour.
// Pour rester DRY, on lit le JSON via fetch HTTP (Deno) en dev, mais en
// prod on embed la version compactée pour la fiabilité.
const KNOWLEDGE_BASE: Record<string, { primary: string; secondary: string[]; evidence: any[] }> = {
  'quercus robur': { primary: 'indigene', secondary: ['patrimoniale'], evidence: [{ source: 'INPN', url: 'https://inpn.mnhn.fr/espece/cd_nom/610645', quote: 'Statut : Indigène en France métropolitaine.' }] },
  'quercus pubescens': { primary: 'indigene', secondary: [], evidence: [{ source: 'INPN', url: 'https://inpn.mnhn.fr/espece/cd_nom/610641', quote: 'Indigène — coteaux calcaires du Périgord noir.' }] },
  'castanea sativa': { primary: 'indigene', secondary: [], evidence: [{ source: 'INPN', url: 'https://inpn.mnhn.fr/espece/cd_nom/89304', quote: 'Indigène (cryptogène ancien) des forêts acides périgourdines.' }] },
  'robinia pseudoacacia': { primary: 'eee', secondary: ['auxiliaire'], evidence: [{ source: 'INPN-EEE', url: 'https://inpn.mnhn.fr/espece/cd_nom/103029', quote: 'EEE avérée. Originaire d\'Amérique du Nord.' }, { source: 'ITSAP', url: 'https://www.itsap.asso.fr/', quote: 'Plante mellifère majeure (miel d\'acacia).' }] },
  'reynoutria japonica': { primary: 'eee', secondary: [], evidence: [{ source: 'UE-1143/2014', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:02016R1141-20220802', quote: 'Renouée du Japon — Liste de l\'Union des EEE.' }] },
  'ludwigia grandiflora': { primary: 'eee', secondary: [], evidence: [{ source: 'UE-1143/2014', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:02016R1141-20220802', quote: 'Jussie à grandes fleurs — Liste de l\'Union.' }] },
  'ailanthus altissima': { primary: 'eee', secondary: [], evidence: [{ source: 'UE-1143/2014', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:02016R1141-20220802', quote: 'Ailante glanduleux — Liste de l\'Union.' }] },
  'ambrosia artemisiifolia': { primary: 'eee', secondary: [], evidence: [{ source: 'INPN-EEE', url: 'https://inpn.mnhn.fr/espece/cd_nom/82046', quote: 'Ambroisie — EEE avérée, enjeu sanitaire.' }] },
  'myocastor coypus': { primary: 'eee', secondary: [], evidence: [{ source: 'INPN-EEE', url: 'https://inpn.mnhn.fr/espece/cd_nom/61667', quote: 'Ragondin — EEE avérée, classé nuisible.' }] },
  'procambarus clarkii': { primary: 'eee', secondary: [], evidence: [{ source: 'UE-1143/2014', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:02016R1141-20220802', quote: 'Écrevisse de Louisiane — Liste de l\'Union.' }] },
  'lutra lutra': { primary: 'patrimoniale', secondary: ['indigene'], evidence: [{ source: 'UICN-France', url: 'https://uicn.fr/liste-rouge-mammiferes/', quote: 'Loutre d\'Europe — espèce protégée nationalement.' }, { source: 'Arrêté-23-avril-2007', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000465500/', quote: 'Mammifère terrestre protégé (article 2).' }] },
  'austropotamobius pallipes': { primary: 'patrimoniale', secondary: ['bioindicatrice'], evidence: [{ source: 'UICN-France', url: 'https://uicn.fr/liste-rouge-france/', quote: 'Écrevisse à pattes blanches — Vulnérable (VU).' }] },
  'milvus migrans': { primary: 'patrimoniale', secondary: ['indigene', 'auxiliaire'], evidence: [{ source: 'UICN-France', url: 'https://uicn.fr/liste-rouge-oiseaux/', quote: 'Milan noir — espèce protégée nationalement.' }] },
  'lullula arborea': { primary: 'patrimoniale', secondary: ['bioindicatrice'], evidence: [{ source: 'Directive-Oiseaux-2009/147/CE', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009L0147', quote: 'Annexe I — Alouette lulu, intérêt communautaire.' }] },
  'salmo trutta fario': { primary: 'patrimoniale', secondary: ['bioindicatrice', 'indigene'], evidence: [{ source: 'UICN-France', url: 'https://uicn.fr/liste-rouge-poissons/', quote: 'Truite fario — indicatrice eaux fraîches.' }] },
  'emys orbicularis': { primary: 'patrimoniale', secondary: [], evidence: [{ source: 'UICN-France', url: 'https://uicn.fr/liste-rouge-reptiles-amphibiens/', quote: 'Cistude d\'Europe — Quasi menacée (NT).' }] },
  'apis mellifera': { primary: 'auxiliaire', secondary: ['indigene'], evidence: [{ source: 'INRAE', url: 'https://www.inrae.fr/actualites/abeille-pollinisateur-essentiel', quote: 'Abeille domestique — pollinisateur majeur.' }] },
  'lumbricus terrestris': { primary: 'auxiliaire', secondary: ['bioindicatrice'], evidence: [{ source: 'INRAE', url: 'https://www.inrae.fr/', quote: 'Ver de terre — ingénieur du sol, indicateur clé.' }] },
  'erinaceus europaeus': { primary: 'auxiliaire', secondary: ['patrimoniale', 'indigene'], evidence: [{ source: 'Arrêté-23-avril-2007', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000465500/', quote: 'Hérisson d\'Europe — espèce protégée.' }, { source: 'LPO', url: 'https://www.lpo.fr/decouvrir-la-nature/fiches-especes/herisson', quote: 'Auxiliaire : limaces, vers, insectes ravageurs.' }] },
  'coccinella septempunctata': { primary: 'auxiliaire', secondary: ['indigene'], evidence: [{ source: 'INRAE-Ephytia', url: 'http://ephytia.inra.fr/', quote: 'Coccinelle à 7 points — prédateur de pucerons.' }] },
  'bombus terrestris': { primary: 'auxiliaire', secondary: ['indigene'], evidence: [{ source: 'OPIE', url: 'https://www.insectes.org/', quote: 'Bourdon terrestre — pollinisateur clé.' }] },
  'aphis fabae': { primary: 'ravageur', secondary: [], evidence: [{ source: 'EPPO', url: 'https://gd.eppo.int/taxon/APHIFA', quote: 'Puceron noir de la fève — pest status confirmed.' }] },
  'drosophila suzukii': { primary: 'ravageur', secondary: ['eee'], evidence: [{ source: 'EPPO', url: 'https://gd.eppo.int/taxon/DROSSU', quote: 'Drosophile suzukii — ravageur des fruits rouges, originaire d\'Asie.' }] },
  'cydia pomonella': { primary: 'ravageur', secondary: [], evidence: [{ source: 'EPPO', url: 'https://gd.eppo.int/taxon/CYDIPO', quote: 'Carpocapse — principal ravageur des pommiers et noyers.' }] },
  'halyomorpha halys': { primary: 'ravageur', secondary: ['eee'], evidence: [{ source: 'EPPO', url: 'https://gd.eppo.int/taxon/HALYHA', quote: 'Punaise diabolique — EEE et ravageur polyphage.' }] },
  'taraxacum officinale': { primary: 'bioindicatrice', secondary: ['indigene', 'auxiliaire'], evidence: [{ source: 'Tela-Botanica', url: 'https://www.tela-botanica.org/bdtfx-nn-65327', quote: 'Pissenlit — Ellenberg N=8 (sols nitrophiles).' }] },
  'urtica dioica': { primary: 'bioindicatrice', secondary: ['indigene', 'auxiliaire'], evidence: [{ source: 'Tela-Botanica', url: 'https://www.tela-botanica.org/bdtfx-nn-69866', quote: 'Ortie — Ellenberg N=8 (nitrophile, sols perturbés).' }] },
  'plantago lanceolata': { primary: 'bioindicatrice', secondary: ['indigene'], evidence: [{ source: 'Tela-Botanica', url: 'https://www.tela-botanica.org/bdtfx-nn-50313', quote: 'Plantain lancéolé — indicateur prairies pâturées.' }] },
  'cladonia': { primary: 'bioindicatrice', secondary: [], evidence: [{ source: 'AFL', url: 'https://www.afl-lichenologie.fr/', quote: 'Lichens Cladonia — bio-indicateurs qualité air.' }] },
  'iris pseudacorus': { primary: 'indigene', secondary: ['bioindicatrice'], evidence: [{ source: 'Tela-Botanica', url: 'https://www.tela-botanica.org/bdtfx-nn-34707', quote: 'Iris faux-acore — indicateur zones humides.' }] },
  'cardamine pratensis': { primary: 'indigene', secondary: ['bioindicatrice'], evidence: [{ source: 'Tela-Botanica', url: 'https://www.tela-botanica.org/bdtfx-nn-13750', quote: 'Cardamine des prés — prairies humides peu intensifiées.' }] },
  'prunus laurocerasus': { primary: 'eee', secondary: [], evidence: [{ source: 'INPN-EEE', url: 'https://inpn.mnhn.fr/espece/cd_nom/116507', quote: 'Laurier-cerise — EEE émergente, étouffe la flore indigène.' }] },
  'buddleja davidii': { primary: 'eee', secondary: [], evidence: [{ source: 'INPN-EEE', url: 'https://inpn.mnhn.fr/espece/cd_nom/86305', quote: 'Arbre aux papillons — EEE avérée.' }] },
  'turdus merula': { primary: 'indigene', secondary: [], evidence: [{ source: 'INPN', url: 'https://inpn.mnhn.fr/espece/cd_nom/4117', quote: 'Merle noir — indigène, espèce protégée.' }] },
  'parus major': { primary: 'indigene', secondary: ['auxiliaire'], evidence: [{ source: 'INPN', url: 'https://inpn.mnhn.fr/espece/cd_nom/3764', quote: 'Mésange charbonnière — protégée. Auxiliaire : chenilles processionnaires.' }] },
  'pieris brassicae': { primary: 'ravageur', secondary: ['indigene'], evidence: [{ source: 'INRAE-Ephytia', url: 'http://ephytia.inra.fr/', quote: 'Piéride du chou — ravageur des Brassicacées.' }] },
  'vipera aspis': { primary: 'patrimoniale', secondary: ['indigene'], evidence: [{ source: 'Arrêté-19-novembre-2007', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000017876221/', quote: 'Vipère aspic — espèce de reptile protégée.' }] },
  'salamandra salamandra': { primary: 'patrimoniale', secondary: ['bioindicatrice'], evidence: [{ source: 'Arrêté-19-novembre-2007', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000017876221/', quote: 'Salamandre tachetée — protégée. Bio-indicatrice forêts humides matures.' }] },
  'ophrys apifera': { primary: 'patrimoniale', secondary: ['indigene'], evidence: [{ source: 'Liste-Rouge-Orchidees-France', url: 'https://uicn.fr/liste-rouge-orchidees/', quote: 'Ophrys abeille — orchidée, populations en régression locale.' }] },
  'helianthemum nummularium': { primary: 'indigene', secondary: ['bioindicatrice'], evidence: [{ source: 'Tela-Botanica', url: 'https://www.tela-botanica.org/bdtfx-nn-31459', quote: 'Hélianthème — pelouses calcaires sèches.' }] },
};

interface SpeciesInput {
  key: string;
  scientificName: string | null;
  commonName: string | null;
  count: number;
}

interface ClassificationResult {
  key: string;
  primary: string;
  secondary: string[];
  ai_score: number;
  ai_reason: string;
  evidence: Array<{ source: string; url?: string; quote: string; ref_code?: string }>;
  source: 'knowledge_base' | 'ai';
  confidence: number;
  needs_review: boolean;
}

// Lookup KB normalisé (case + espaces)
function lookupKnowledgeBase(scientificName: string | null): ClassificationResult | null {
  if (!scientificName) return null;
  const normalized = scientificName.toLowerCase().trim();
  const entry = KNOWLEDGE_BASE[normalized];
  if (!entry) {
    // Tente avec genre seul (ex: "Cladonia foliacea" → "cladonia")
    const genus = normalized.split(' ')[0];
    if (genus !== normalized && KNOWLEDGE_BASE[genus]) {
      return {
        key: scientificName,
        primary: KNOWLEDGE_BASE[genus].primary,
        secondary: KNOWLEDGE_BASE[genus].secondary,
        ai_score: 70,
        ai_reason: `Classification au niveau du genre ${genus} (espèce non listée individuellement).`,
        evidence: KNOWLEDGE_BASE[genus].evidence.map(e => ({ ...e, ref_code: 'genus_match' })),
        source: 'knowledge_base',
        confidence: 0.8,
        needs_review: false,
      };
    }
    return null;
  }
  return {
    key: scientificName,
    primary: entry.primary,
    secondary: entry.secondary,
    ai_score: 85, // valeur par défaut, sera ajustée par catégorie
    ai_reason: `Classification depuis le référentiel local (v${KB_VERSION}).`,
    evidence: entry.evidence,
    source: 'knowledge_base',
    confidence: 1.0,
    needs_review: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { explorationId } = await req.json();
    if (!explorationId) {
      return new Response(JSON.stringify({ error: 'explorationId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) throw new Error('LOVABLE_API_KEY not configured');

    // Auth + curator check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: isCurator } = await admin.rpc('is_exploration_curator', { _user_id: userId });
    if (!isCurator) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build species pool (inchangé)
    const { data: em } = await admin
      .from('exploration_marches')
      .select('marche_id, marches(id, latitude, longitude)')
      .eq('exploration_id', explorationId);

    const marchesArr = (em || [])
      .map((x: any) => x.marches)
      .filter((m: any) => m && m.id);
    const marchesTotal = marchesArr.length;
    const marchesWithGps = marchesArr.filter((m: any) => m.latitude != null && m.longitude != null).length;

    if (marchesTotal === 0) {
      return new Response(JSON.stringify({
        analyzed: 0, status: 'no_marches', marches_total: 0, marches_with_gps: 0, marches_with_snapshots: 0,
        message: "Aucune marche dans cette exploration. Crée d'abord une marche dans l'onglet Marches.",
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const marcheIds = marchesArr.map((m: any) => m.id);
    const { data: snaps } = await admin
      .from('biodiversity_snapshots')
      .select('marche_id, species_data')
      .in('marche_id', marcheIds);
    const snapsArr = snaps || [];
    const marchesWithSnapshots = new Set(snapsArr.map((s: any) => s.marche_id)).size;

    const map = new Map<string, SpeciesInput>();
    snapsArr.forEach((s: any) => {
      const arr = Array.isArray(s.species_data) ? s.species_data : [];
      arr.forEach((sp: any) => {
        const sci = (sp.scientificName || sp.scientific_name || '').toString().trim();
        const com = (sp.commonName || sp.common_name || sp.vernacularName || '').toString().trim();
        const key = (sci || com).toLowerCase();
        if (!key) return;
        const existing = map.get(key);
        if (existing) existing.count += 1;
        else map.set(key, { key: sci || com, scientificName: sci || null, commonName: com || null, count: 1 });
      });
    });

    const pool = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, MAX_SPECIES);

    if (pool.length === 0) {
      let status: 'no_gps' | 'no_snapshots' | 'empty_pool' = 'empty_pool';
      let message = "Pool d'espèces vide pour cette exploration.";
      if (marchesWithGps === 0) {
        status = 'no_gps';
        message = `Aucune des ${marchesTotal} marche(s) n'a de coordonnées GPS.`;
      } else if (marchesWithSnapshots === 0) {
        status = 'no_snapshots';
        message = `${marchesWithGps} marche(s) géolocalisée(s), mais aucune collecte biodiversité n'a été faite.`;
      }
      return new Response(JSON.stringify({
        analyzed: 0, status, marches_total: marchesTotal, marches_with_gps: marchesWithGps,
        marches_with_snapshots: marchesWithSnapshots, message,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── CASCADE NIVEAU 1 — Knowledge Base ───
    const classified: ClassificationResult[] = [];
    const needsAi: SpeciesInput[] = [];

    for (const sp of pool) {
      const kb = lookupKnowledgeBase(sp.scientificName);
      if (kb) {
        classified.push({ ...kb, key: sp.key });
      } else {
        needsAi.push(sp);
      }
    }

    console.log(`[analyze] KB hits: ${classified.length}/${pool.length}, AI needed: ${needsAi.length}`);

    // ─── CASCADE NIVEAU 3 — IA avec citations obligatoires ───
    if (needsAi.length > 0) {
      const systemPrompt = `Tu es un naturaliste éditorial pour "La Fréquence du Vivant", un projet géopoétique en Dordogne, France.

Tu classes des espèces selon 6 catégories STRICTES :
- indigene : espèce naturellement présente en France métropolitaine (statut INPN indigène ou cryptogène)
- bioindicatrice : sa présence renseigne sur un facteur écologique mesurable (Ellenberg, IBGN, IBD, lichens)
- auxiliaire : service écosystémique direct (pollinisation, prédation de ravageurs, décomposition)
- ravageur : dégâts économiques aux cultures (référencé EPPO, INRAE Ephytia)
- eee : Espèce Exotique Envahissante avérée (règlement UE 1143/2014 OU INPN EEE France métropolitaine)
- patrimoniale : protégée par arrêté national/régional OU UICN France ≥ NT (Quasi menacée, Vulnérable, En danger…)

RÈGLES IMPÉRATIVES :
1. Tu choisis UNE catégorie principale (la plus saillante) + 0 à 2 catégories secondaires si pertinent.
2. PRIORITÉ de la principale quand plusieurs s'appliquent : eee > patrimoniale > ravageur > bioindicatrice > auxiliaire > indigene.
3. Tu DOIS fournir au moins 1 evidence avec source explicite (INPN, UICN-France, UE-1143/2014, EPPO, INRAE, Tela-Botanica, OPIE, LPO, ITSAP, AFL ou Directive-Habitats/Oiseaux).
4. Si tu ne connais pas la classification, mets confidence < 0.5 et needs_review=true.
5. Le quote doit être une citation factuelle vérifiable (statut INPN, code Liste Rouge…), pas une généralité.
6. ai_reason en français, max 18 mots, ton sensible et précis, sans cliché.`;

      const tools = [{
        type: 'function',
        function: {
          name: 'classify_species',
          description: 'Classe les espèces avec catégorisation principale+secondaires et evidence sourcée',
          parameters: {
            type: 'object',
            properties: {
              species: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Identifiant exact reçu en input' },
                    primary: {
                      type: 'string',
                      enum: ['indigene', 'bioindicatrice', 'auxiliaire', 'ravageur', 'eee', 'patrimoniale'],
                    },
                    secondary: {
                      type: 'array',
                      items: { type: 'string', enum: ['indigene', 'bioindicatrice', 'auxiliaire', 'ravageur', 'eee', 'patrimoniale'] },
                      maxItems: 2,
                    },
                    ai_score: { type: 'integer', minimum: 0, maximum: 100 },
                    ai_reason: { type: 'string', maxLength: 200 },
                    evidence: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        type: 'object',
                        properties: {
                          source: { type: 'string', description: 'Nom court du référentiel (INPN, UICN-France, UE-1143/2014, EPPO, INRAE, Tela-Botanica, OPIE, LPO…)' },
                          url: { type: 'string', description: 'URL vers la fiche officielle si connue' },
                          quote: { type: 'string', description: 'Citation factuelle vérifiable (statut, code Liste Rouge, etc.)' },
                          ref_code: { type: 'string' },
                        },
                        required: ['source', 'quote'],
                        additionalProperties: false,
                      },
                    },
                    confidence: { type: 'number', minimum: 0, maximum: 1, description: '0.0 à 1.0' },
                  },
                  required: ['key', 'primary', 'secondary', 'ai_score', 'ai_reason', 'evidence', 'confidence'],
                  additionalProperties: false,
                },
              },
            },
            required: ['species'],
            additionalProperties: false,
          },
        },
      }];

      const userPrompt = `Voici ${needsAi.length} espèce(s) observée(s) en Dordogne (key | scientifique | commun | nb obs). Classe-les toutes en respectant les règles :\n\n${needsAi
        .map(s => `${s.key} | ${s.scientificName || '?'} | ${s.commonName || '?'} | ${s.count}`)
        .join('\n')}`;

      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          tools,
          tool_choice: { type: 'function', function: { name: 'classify_species' } },
        }),
      });

      if (!aiResp.ok) {
        const txt = await aiResp.text();
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: 'Limite IA atteinte, réessaie dans une minute.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: 'Crédits IA épuisés.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        console.error('AI error', aiResp.status, txt);
        throw new Error(`AI gateway error ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error('No tool call in AI response');
      const args = JSON.parse(toolCall.function.arguments);
      const aiResults: any[] = args.species || [];

      aiResults.forEach((r: any) => {
        const evidence = Array.isArray(r.evidence) ? r.evidence : [];
        const confidence = typeof r.confidence === 'number' ? r.confidence : 0.5;
        classified.push({
          key: r.key,
          primary: r.primary,
          secondary: Array.isArray(r.secondary) ? r.secondary : [],
          ai_score: r.ai_score || 50,
          ai_reason: r.ai_reason || '',
          evidence,
          source: 'ai',
          confidence,
          needs_review: confidence < 0.6 || evidence.length === 0,
        });
      });
    }

    // ─── INSERT en base ───
    await admin
      .from('exploration_curations')
      .delete()
      .eq('exploration_id', explorationId)
      .eq('sense', 'oeil')
      .eq('source', 'ai');

    const grouped: Record<string, ClassificationResult[]> = {};
    classified.forEach(r => {
      grouped[r.primary] = grouped[r.primary] || [];
      grouped[r.primary].push(r);
    });
    Object.values(grouped).forEach(arr => arr.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0)));

    const rows = classified.map(r => {
      const grp = grouped[r.primary] || [];
      const idx = grp.findIndex(x => x.key === r.key);
      const pinned = idx >= 0 && idx < 3;
      return {
        exploration_id: explorationId,
        sense: 'oeil',
        entity_type: 'species',
        entity_id: r.key,
        category: r.primary,
        secondary_categories: r.secondary,
        source: 'ai',
        ai_score: r.ai_score,
        ai_reason: r.ai_reason,
        ai_criteria: {},
        classification_evidence: r.evidence,
        classification_source: r.source,
        classification_confidence: r.confidence,
        needs_review: r.needs_review,
        display_order: pinned ? idx : 9999,
        created_by: userId,
      };
    });

    if (rows.length > 0) {
      const { error: insErr } = await admin.from('exploration_curations').insert(rows);
      if (insErr) console.error('Insert curations error:', insErr);
    }

    const summary = {
      categories: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
      sources: {
        knowledge_base: classified.filter(c => c.source === 'knowledge_base').length,
        ai: classified.filter(c => c.source === 'ai').length,
      },
      needs_review: classified.filter(c => c.needs_review).length,
      kb_version: KB_VERSION,
    };

    await admin.from('exploration_ai_analyses').insert({
      exploration_id: explorationId,
      model: MODEL,
      species_analyzed_count: rows.length,
      summary,
      created_by: userId,
    });

    return new Response(JSON.stringify({
      analyzed: rows.length,
      status: 'ok',
      model: MODEL,
      marches_total: marchesTotal,
      marches_with_gps: marchesWithGps,
      marches_with_snapshots: marchesWithSnapshots,
      summary,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('analyze-exploration-species error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
