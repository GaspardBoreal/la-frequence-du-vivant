import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateAuth, forbiddenResponse, corsHeaders } from "../_shared/auth-helper.ts";

interface SingleTranslationRequest {
  scientificName: string;
  originalCommonName?: string;
  targetLanguage: 'fr' | 'en';
}

interface BatchTranslationRequest {
  items: Array<{ scientificName: string; commonName?: string }>;
  targetLanguage?: 'fr';
}

interface BatchTranslationResponse {
  translations: Record<string, string>; // scientific_name -> french common name
  resolved: number;
  remaining: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ---------- INPN lookup ----------
async function fetchInpn(scientificName: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://taxref.mnhn.fr/api/taxa/search?scientificNames=${encodeURIComponent(scientificName)}`
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j._embedded?.taxa?.[0]?.frenchVernacularName || null;
  } catch {
    return null;
  }
}

// ---------- Lovable AI Gateway batch translate ----------
async function aiBatchTranslate(
  items: Array<{ scientificName: string; commonName?: string }>
): Promise<Record<string, string>> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableKey || items.length === 0) return {};

  const list = items
    .map((it, i) => `${i + 1}. ${it.scientificName}${it.commonName ? ` (EN: ${it.commonName})` : ''}`)
    .join('\n');

  const prompt = `Tu es un expert en taxonomie. Pour chaque espèce ci-dessous, donne le nom vernaculaire FRANÇAIS le plus courant et reconnu (Wikipédia FR, INPN). Si aucun nom vernaculaire français n'existe (taxon de niveau supérieur), garde le nom scientifique. Réponds UNIQUEMENT par un objet JSON dont les clés sont les noms scientifiques exacts et les valeurs sont les noms français.

${list}

Exemple: {"Papaver rhoeas": "Coquelicot", "Quercus": "Chênes"}`;

  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!r.ok) {
      console.error('AI gateway error', r.status, await r.text());
      return {};
    }
    const j = await r.json();
    const content = j.choices?.[0]?.message?.content;
    if (!content) return {};
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('AI batch translate failed', e);
    return {};
  }
}

// ---------- Batch handler ----------
async function handleBatch(req: Request): Promise<Response> {
  const body: BatchTranslationRequest = await req.json();
  const items = (body.items || []).filter(i => i?.scientificName?.trim()).slice(0, 50);
  if (items.length === 0) {
    return new Response(JSON.stringify({ translations: {}, resolved: 0, remaining: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const sciNames = Array.from(new Set(items.map(i => i.scientificName.trim())));

  // Filter already cached
  const { data: existing } = await supabase
    .from('species_translations')
    .select('scientific_name, common_name_fr')
    .in('scientific_name', sciNames);

  const cached = new Map<string, string>();
  (existing || []).forEach((r: any) => {
    if (r.common_name_fr) cached.set(r.scientific_name, r.common_name_fr);
  });

  const missing = items.filter(i => !cached.has(i.scientificName.trim()));
  console.log(`[translate-species batch] ${cached.size} cached, ${missing.length} to resolve`);

  // 1. Try INPN for first 10 missing (fast and accurate)
  const inpnResults: Record<string, string> = {};
  const inpnTargets = missing.slice(0, 10);
  await Promise.all(
    inpnTargets.map(async it => {
      const fr = await fetchInpn(it.scientificName.trim());
      if (fr) inpnResults[it.scientificName.trim()] = fr;
    })
  );

  // 2. AI for the rest
  const stillMissing = missing.filter(i => !inpnResults[i.scientificName.trim()]);
  const aiResults = await aiBatchTranslate(stillMissing);

  // 3. Persist new translations
  const toInsert: any[] = [];
  Object.entries(inpnResults).forEach(([sci, fr]) => {
    toInsert.push({ scientific_name: sci, common_name_fr: fr, source: 'inpn', confidence_level: 'high' });
  });
  Object.entries(aiResults).forEach(([sci, fr]) => {
    if (!inpnResults[sci]) {
      toInsert.push({ scientific_name: sci, common_name_fr: fr, source: 'ai', confidence_level: 'medium' });
    }
  });

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('species_translations')
      .upsert(toInsert, { onConflict: 'scientific_name', ignoreDuplicates: false });
    if (error) console.error('Upsert failed', error);
  }

  const translations: Record<string, string> = {};
  cached.forEach((v, k) => (translations[k] = v));
  Object.assign(translations, inpnResults, aiResults);

  const response: BatchTranslationResponse = {
    translations,
    resolved: Object.keys(translations).length,
    remaining: sciNames.length - Object.keys(translations).length,
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ---------- Single (legacy admin) handler ----------
async function handleSingle(req: Request, body: SingleTranslationRequest): Promise<Response> {
  const { isAdmin, errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;
  if (!isAdmin) return forbiddenResponse();

  const { scientificName, originalCommonName, targetLanguage } = body;
  if (!scientificName) {
    return new Response(JSON.stringify({ error: 'Scientific name is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let translatedName = '';
  let source: 'inpn' | 'ai' | 'manual' = 'manual';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (targetLanguage === 'fr') {
    const inpn = await fetchInpn(scientificName);
    if (inpn) {
      translatedName = inpn;
      source = 'inpn';
      confidence = 'high';
    }
  }

  if (!translatedName) {
    const ai = await aiBatchTranslate([{ scientificName, commonName: originalCommonName }]);
    const fr = ai[scientificName];
    if (fr) {
      translatedName = fr;
      source = 'ai';
      confidence = 'medium';
    }
  }

  if (translatedName) {
    await supabase.from('species_translations').upsert(
      {
        scientific_name: scientificName,
        common_name_fr: translatedName,
        source,
        confidence_level: confidence,
      },
      { onConflict: 'scientific_name' }
    );
  }

  return new Response(
    JSON.stringify({
      commonName: translatedName || originalCommonName || scientificName,
      source,
      confidence: translatedName ? confidence : 'low',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Batch mode: any authenticated user can populate the shared FR cache
    if (Array.isArray(body?.items)) {
      // Lightweight auth check: must have an Authorization header
      const auth = req.headers.get('Authorization');
      if (!auth) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return await handleBatch(req);
    }

    return await handleSingle(req, body);
  } catch (error: any) {
    console.error('translate-species error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
