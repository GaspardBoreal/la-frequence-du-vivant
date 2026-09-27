// Nom vernaculaire FR selon iNaturalist (place France = 6753), aligné sur TAXREF/INPN.
export async function fetchInatFr(scientificName: string): Promise<string | null> {
  const sci = scientificName.trim();
  if (!sci) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sci)}&locale=fr&preferred_place_id=6753&per_page=10`;
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'la-frequence-du-vivant/1.0' },
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j: any = await r.json();
    const hit = (j.results || []).find(
      (x: any) => (x.name || '').toLowerCase() === sci.toLowerCase(),
    );
    const fr: string = (hit?.preferred_common_name || '').trim();
    if (!fr || fr.toLowerCase() === sci.toLowerCase()) return null;
    return fr.charAt(0).toUpperCase() + fr.slice(1);
  } catch {
    return null;
  }
}
