// Resolve iNaturalist user profile from an observation URL OR a login slug.
// Public read-only API. JWT optional but verified when provided for basic abuse control.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CacheEntry = { data: any; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

function extractObservationId(input: string): string | null {
  if (!input) return null;
  if (/^\d+$/.test(input)) return input;
  const m = input.match(/observations\/(\d+)/);
  return m ? m[1] : null;
}

function buildUserPayload(user: any) {
  if (!user) return null;
  return {
    id: user.id ?? null, // ⚠ numeric iNat user id — immuable
    login: user.login,
    name: user.name || user.login,
    icon_url: user.icon_url || user.icon || null,
    observations_count: user.observations_count ?? null,
    species_count: user.species_count ?? null,
    identifications_count: user.identifications_count ?? null,
    profile_url: user.login
      ? `https://www.inaturalist.org/people/${user.login}`
      : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Best-effort JWT verification (do not fail if missing — public data)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
      } catch (_) {
        // ignore — public data
      }
    }

    const body = await req.json().catch(() => ({}));

    // ─── Mode 1 : lookup direct par login ──────────────────────────────
    const loginIn = String(body.login || "").trim();
    if (loginIn) {
      const cacheKey = `login:${loginIn.toLowerCase()}`;
      const now = Date.now();
      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await fetch(
        `https://api.inaturalist.org/v1/users/${encodeURIComponent(loginIn)}`,
        { headers: { "User-Agent": "MarchesDuVivant/1.0" } },
      );
      if (!r.ok) {
        return new Response(
          JSON.stringify({ error: `iNat API ${r.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const j = await r.json();
      const user = j?.results?.[0] || j?.user || null;
      const payload = buildUserPayload(user);
      if (!payload) {
        return new Response(JSON.stringify({ error: "user not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      cache.set(cacheKey, { data: payload, expiresAt: now + CACHE_TTL_MS });
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Mode 2 : lookup par observation URL / id ──────────────────────
    const raw = String(body.observation_url || body.observation_id || "");
    const obsId = extractObservationId(raw);

    if (!obsId) {
      return new Response(
        JSON.stringify({ error: "observation_url, observation_id or login required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = `obs:${obsId}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inatRes = await fetch(
      `https://api.inaturalist.org/v1/observations/${obsId}`,
      { headers: { "User-Agent": "MarchesDuVivant/1.0" } }
    );
    if (!inatRes.ok) {
      return new Response(
        JSON.stringify({ error: `iNat API ${inatRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const inatJson = await inatRes.json();
    const result = inatJson?.results?.[0];
    const user = result?.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = buildUserPayload(user);
    cache.set(cacheKey, { data: payload, expiresAt: now + CACHE_TTL_MS });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
