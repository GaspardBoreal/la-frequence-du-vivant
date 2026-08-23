/**
 * Import d'un « lot » d'exemples de jardin depuis un ZIP éditorial.
 *
 * Le ZIP est la source de vérité : un fichier JSON (type + exemples + règles
 * de génération) et des images déjà aux bonnes dimensions (grands + vignettes).
 * Les images sont téléversées TELLES QUELLES (pas de recompression) dans le
 * bucket public `onboarding-gallery`, sous :
 *
 *   garden-types/<stable_id_du_type>/grands/<nom d'origine>
 *   garden-types/<stable_id_du_type>/vignettes/<nom d'origine>
 *
 * L'import est relançable : upsert par identifiant stable, jamais de doublon,
 * et les autres types de jardin ne sont pas touchés.
 */
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { GALLERY_BUCKET } from '@/lib/onboarding/uploadGalleryImage';

/* ------------------------------------------------------------------ types */

export interface LotExample {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  large_image: string;
  thumbnail_image: string;
  alt?: string;
  user_intent?: string;
  keywords?: string[];
  ai_profile?: Record<string, unknown>;
}

export interface LotManifest {
  garden_type: {
    id: string;
    label: string;
    baseline?: string;
    locale?: string;
    climate_scope?: string;
  };
  image_spec?: Record<string, unknown>;
  generation_logic?: Record<string, unknown>;
  examples: LotExample[];
}

export interface LotImageReport {
  path: string;
  ok: boolean;
  bytes?: number;
  error?: string;
}

export interface LotExampleReport {
  stable_id: string;
  titre: string;
  action: 'inséré' | 'mis à jour';
  imagesOk: number;
  imagesTotal: number;
}

export interface LotReport {
  typeStableId: string;
  typeAction: 'créé' | 'mis à jour';
  exemples: LotExampleReport[];
  images: LotImageReport[];
  errors: string[];
}

/* -------------------------------------------------------------- validation */

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Contrôle structurel du manifeste. Lève une Error explicite si invalide. */
export function validateManifest(raw: unknown): LotManifest {
  const m = raw as LotManifest;
  if (!m || typeof m !== 'object') throw new Error('JSON illisible : objet attendu à la racine.');
  if (!m.garden_type?.id || !m.garden_type?.label) {
    throw new Error('Le bloc « garden_type » doit contenir id et label.');
  }
  if (!Array.isArray(m.examples) || m.examples.length === 0) {
    throw new Error('Aucun exemple dans le manifeste.');
  }
  const seen = new Set<string>();
  const orders = new Set<number>();
  m.examples.forEach((e, i) => {
    const where = `exemple n°${i + 1}`;
    if (!e.id) throw new Error(`${where} : identifiant stable manquant.`);
    if (seen.has(e.id)) throw new Error(`Identifiant dupliqué : « ${e.id} ».`);
    seen.add(e.id);
    if (typeof e.order !== 'number') throw new Error(`${where} (« ${e.id} ») : ordre manquant.`);
    if (orders.has(e.order)) throw new Error(`Ordre d'affichage dupliqué : ${e.order}.`);
    orders.add(e.order);
    if (!e.title) throw new Error(`${where} (« ${e.id} ») : titre manquant.`);
    if (!e.large_image || !e.thumbnail_image) {
      throw new Error(`${where} (« ${e.id} ») : chemins d'images manquants.`);
    }
  });
  return m;
}

/* ----------------------------------------------------------------- helpers */

/** Retrouve une entrée du ZIP par son chemin relatif de fin (« grands/01-….webp »). */
const findEntry = (zip: JSZip, relativePath: string): JSZip.JSZipObject | null => {
  const norm = relativePath.replace(/^\/+/, '');
  let found: JSZip.JSZipObject | null = null;
  zip.forEach((path, entry) => {
    if (!entry.dir && (path === norm || path.endsWith(`/${norm}`))) found = entry;
  });
  return found;
};

const publicUrl = (path: string) =>
  supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl;

/** Correspondance souple : stable_id exact, puis slug exact, puis slug sans préfixe « jardin_ ». */
async function findTypeRow(stableId: string) {
  const client = () => supabase as unknown as { from: (t: string) => any };
  const byStable = await client()
    .from('onboarding_garden_types')
    .select('id, slug, image_url')
    .eq('stable_id', stableId)
    .maybeSingle();
  if (byStable?.data) return byStable.data as { id: string; slug: string; image_url: string | null };

  const slugCandidates = [stableId, stableId.replace(/^jardin_/, '')];
  for (const slug of slugCandidates) {
    const res = await client()
      .from('onboarding_garden_types')
      .select('id, slug, image_url')
      .eq('slug', slug)
      .maybeSingle();
    if (res?.data) return res.data as { id: string; slug: string; image_url: string | null };
  }
  return null;
}

/* ------------------------------------------------------------------ analyse */

export interface LotTypeCandidate {
  id: string;
  slug: string;
  titre: string;
  stable_id: string | null;
  position: number;
  exemplesCount: number;
}

export interface LotAnalysis {
  file: File;
  manifest: LotManifest;
  /** Type existant correspondant au manifeste (stable_id ou slug), s'il y en a un. */
  matchedTypeId: string | null;
  /** Tous les types du catalogue, ceux sans exemples en premier. */
  candidates: LotTypeCandidate[];
}

/**
 * Lit et valide un ZIP de lot SANS rien écrire : manifeste, type correspondant
 * éventuel et catalogue des types candidats pour le rattachement manuel.
 */
export async function analyzeGardenLot(file: File): Promise<LotAnalysis> {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file(/(^|\/)[^/]*\.json$/i).find((e) => !e.dir);
  if (!manifestEntry) throw new Error('Aucun fichier JSON trouvé dans le ZIP.');
  const manifest = validateManifest(JSON.parse(await manifestEntry.async('string')));

  const client = () => supabase as unknown as { from: (t: string) => any };
  const [typesRes, exRes] = await Promise.all([
    client()
      .from('onboarding_garden_types')
      .select('id, slug, titre, stable_id, position')
      .order('position', { ascending: true }),
    client().from('onboarding_garden_examples').select('type_id'),
  ]);
  if (typesRes.error) throw new Error(`Lecture des types : ${typesRes.error.message}`);

  const counts = new Map<string, number>();
  ((exRes?.data ?? []) as { type_id: string }[]).forEach((r) =>
    counts.set(r.type_id, (counts.get(r.type_id) ?? 0) + 1),
  );
  const candidates: LotTypeCandidate[] = ((typesRes.data ?? []) as Omit<LotTypeCandidate, 'exemplesCount'>[])
    .map((t) => ({ ...t, exemplesCount: counts.get(t.id) ?? 0 }))
    .sort((a, b) => (a.exemplesCount === 0 ? 0 : 1) - (b.exemplesCount === 0 ? 0 : 1) || a.position - b.position);

  const matched = await findTypeRow(manifest.garden_type.id);
  return { file, manifest, matchedTypeId: matched?.id ?? null, candidates };
}

/* ------------------------------------------------------------------ import */

export interface ImportOptions {
  /**
   * Identifiant du type auquel rattacher le lot (choisi par l'admin).
   * Absent ou null : détection automatique (stable_id/slug), création si inconnu.
   */
  targetTypeId?: string | null;
}

/**
 * Importe un lot ZIP complet : validation, téléversement des images,
 * mise à jour du type et upsert des exemples. Renvoie un rapport détaillé.
 */
export async function importGardenLot(
  file: File,
  onProgress?: (message: string) => void,
  options?: ImportOptions,
): Promise<LotReport> {
  const report: LotReport = {
    typeStableId: '',
    typeAction: 'mis à jour',
    exemples: [],
    images: [],
    errors: [],
  };
  const say = (m: string) => onProgress?.(m);

  say('Lecture du ZIP…');
  const zip = await JSZip.loadAsync(file);

  const manifestEntry = zip.file(/(^|\/)[^/]*\.json$/i).find((e) => !e.dir);
  if (!manifestEntry) throw new Error('Aucun fichier JSON trouvé dans le ZIP.');
  const manifest = validateManifest(JSON.parse(await manifestEntry.async('string')));
  const gt = manifest.garden_type;
  report.typeStableId = gt.id;
  say(`Manifeste valide : ${manifest.examples.length} exemples pour « ${gt.label} ».`);

  // -- 1. Type de jardin ----------------------------------------------------
  const client = () => supabase as unknown as { from: (t: string) => any };
  const existing = await findTypeRow(gt.id);
  let typeId: string;

  const typePayload: Record<string, unknown> = {
    baseline: gt.baseline ?? null,
    locale: gt.locale ?? null,
    climate_scope: gt.climate_scope ?? null,
    image_spec: manifest.image_spec ?? null,
    generation_logic: manifest.generation_logic ?? null,
    stable_id: gt.id,
  };

  if (existing) {
    typeId = existing.id;
    // La couverture existante est conservée si elle existe déjà.
    if (!existing.image_url) {
      const first = manifest.examples.slice().sort((a, b) => a.order - b.order)[0];
      typePayload.image_url = publicUrl(`garden-types/${gt.id}/${first.large_image}`);
    }
    const { error } = await client().from('onboarding_garden_types').update(typePayload).eq('id', typeId);
    if (error) throw new Error(`Type de jardin : ${error.message}`);
    report.typeAction = 'mis à jour';
  } else {
    const { data, error } = await client()
      .from('onboarding_garden_types')
      .insert({
        ...typePayload,
        slug: gt.id.replace(/^jardin_/, '').replace(/_/g, '_'),
        titre: gt.label,
        sous_titre: gt.baseline ?? null,
        image_url: publicUrl(
          `garden-types/${gt.id}/${manifest.examples.slice().sort((a, b) => a.order - b.order)[0].large_image}`,
        ),
        position: 99,
        visible: true,
      })
      .select('id')
      .single();
    if (error) throw new Error(`Création du type : ${error.message}`);
    typeId = data.id;
    report.typeAction = 'créé';
  }
  say(`Type « ${gt.label} » ${report.typeAction}.`);

  // -- 2. Images + exemples ---------------------------------------------------
  for (const ex of manifest.examples.slice().sort((a, b) => a.order - b.order)) {
    say(`Exemple ${ex.order} · ${ex.title} : téléversement des images…`);
    let imagesOk = 0;

    for (const rel of [ex.large_image, ex.thumbnail_image]) {
      const storagePath = `garden-types/${gt.id}/${rel.replace(/^\/+/, '')}`;
      const entry = findEntry(zip, rel);
      if (!entry) {
        report.images.push({ path: storagePath, ok: false, error: 'fichier absent du ZIP' });
        report.errors.push(`${ex.id} : ${rel} absent du ZIP`);
        continue;
      }
      const blob = await entry.async('blob');
      const typed = new Blob([blob], { type: 'image/webp' });
      const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(storagePath, typed, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '3600',
      });
      if (error) {
        report.images.push({ path: storagePath, ok: false, error: error.message });
        report.errors.push(`${ex.id} : ${rel} — ${error.message}`);
      } else {
        report.images.push({ path: storagePath, ok: true, bytes: typed.size });
        imagesOk += 1;
      }
    }

    // Upsert manuel par identifiant stable (l'unicité partielle n'est pas
    // adressable par PostgREST ON CONFLICT).
    say(`Exemple ${ex.order} · ${ex.title} : enregistrement en base…`);
    const row = {
      type_id: typeId,
      stable_id: ex.id,
      titre: ex.title,
      sous_titre: ex.subtitle ?? null,
      description: ex.user_intent ?? null,
      image_url: publicUrl(`garden-types/${gt.id}/${ex.large_image.replace(/^\/+/, '')}`),
      thumbnail_url: publicUrl(`garden-types/${gt.id}/${ex.thumbnail_image.replace(/^\/+/, '')}`),
      image_alt: ex.alt ?? null,
      user_intent: ex.user_intent ?? null,
      keywords: asStringArray(ex.keywords),
      ai_profile: ex.ai_profile ?? null,
      position: ex.order,
      publie: true,
    };

    const existingEx = await client()
      .from('onboarding_garden_examples')
      .select('id')
      .eq('type_id', typeId)
      .eq('stable_id', ex.id)
      .maybeSingle();

    let action: 'inséré' | 'mis à jour' = 'inséré';
    if (existingEx?.data?.id) {
      const { error } = await client()
        .from('onboarding_garden_examples')
        .update(row)
        .eq('id', existingEx.data.id);
      if (error) throw new Error(`Exemple « ${ex.id} » : ${error.message}`);
      action = 'mis à jour';
    } else {
      const { error } = await client().from('onboarding_garden_examples').insert(row);
      if (error) throw new Error(`Exemple « ${ex.id} » : ${error.message}`);
    }

    report.exemples.push({
      stable_id: ex.id,
      titre: ex.title,
      action,
      imagesOk,
      imagesTotal: 2,
    });
  }

  say('Import terminé.');
  return report;
}
