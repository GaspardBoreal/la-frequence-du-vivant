/**
 * Sous-menu « Boussole » de l'onglet Exemples : exploration par facettes
 * sur toutes les métadonnées des exemples — mots-clés, intentions du
 * jardinier, personas, types, état, matière — plus recherche « nom contient »
 * et recherche libre (sous-titre, description, légende, intention, profil IA).
 *
 * Filtrage 100 % local (la collection est déjà en mémoire), normalisation
 * NFD insensible aux accents, tri par pertinence. Les pastilles qui ne
 * mèneraient à aucun résultat s'estompent : la sélection reste cohérente,
 * jamais de cul-de-sac.
 */
import React, { useMemo, useState } from 'react';
import { Compass, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GardenExampleViewer from '@/components/onboarding/GardenExampleViewer';
import ExampleVignette from '@/components/onboarding/admin/ExampleVignette';
import { PERSONAS, PERSONA_LABELS } from '@/config/onboarding/personas';
import type { GardenExample, GardenType } from '@/hooks/onboarding/useOnboardingConfig';

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

type EtatFilter = 'tous' | 'publie' | 'masque';
type PhotoFilter = 'tous' | 'avec' | 'sans';
type Group = 'name' | 'free' | 'keywords' | 'types' | 'intents' | 'personas' | 'etat' | 'photo' | 'source';

interface Item {
  example: GardenExample;
  type?: GardenType;
  typePos: number;
}

interface Props {
  types: GardenType[];
  examples: GardenExample[];
  onEdit: (example: GardenExample) => void;
  onDelete: (example: GardenExample) => void;
}

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

const FacetChip: React.FC<{
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}> = ({ active, disabled, onClick, count, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : disabled
          ? 'border-border/50 text-muted-foreground opacity-40'
          : 'border-border bg-background hover:bg-muted'
    }`}
  >
    {children}
    {typeof count === 'number' && <span className="ml-1 tabular-nums opacity-70">{count}</span>}
  </button>
);

const FacetLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
);

const ExamplesBoussoleView: React.FC<Props> = ({ types, examples, onEdit, onDelete }) => {
  const [nameQ, setNameQ] = useState('');
  const [freeQ, setFreeQ] = useState('');
  const [selKeywords, setSelKeywords] = useState<string[]>([]);
  const [selTypeIds, setSelTypeIds] = useState<string[]>([]);
  const [selIntents, setSelIntents] = useState<string[]>([]);
  const [selPersonas, setSelPersonas] = useState<string[]>([]);
  const [etat, setEtat] = useState<EtatFilter>('tous');
  const [photo, setPhoto] = useState<PhotoFilter>('tous');
  const [avecSource, setAvecSource] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const items = useMemo<Item[]>(() => {
    const byId = new Map(types.map((t) => [t.id, t]));
    return examples.map((e) => {
      const type = byId.get(e.type_id);
      return { example: e, type, typePos: type?.position ?? 999 };
    });
  }, [types, examples]);

  const passes = (item: Item, skip?: Group): boolean => {
    const { example: e, type } = item;
    if (skip !== 'name' && nameQ.trim() && !norm(e.titre).includes(norm(nameQ))) return false;
    if (skip !== 'free' && freeQ.trim()) {
      const haystack = norm(
        [
          e.sous_titre,
          e.description,
          e.image_alt,
          e.user_intent,
          (e.keywords ?? []).join(' '),
          e.ai_profile ? JSON.stringify(e.ai_profile) : '',
        ]
          .filter(Boolean)
          .join(' '),
      );
      const words = norm(freeQ).split(/\s+/).filter(Boolean);
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    if (skip !== 'keywords' && selKeywords.length > 0) {
      const kw = e.keywords ?? [];
      if (!selKeywords.every((k) => kw.includes(k))) return false;
    }
    if (skip !== 'types' && selTypeIds.length > 0 && !selTypeIds.includes(e.type_id)) return false;
    if (skip !== 'intents' && selIntents.length > 0 && !selIntents.includes(e.user_intent ?? '')) return false;
    if (skip !== 'personas' && selPersonas.length > 0) {
      const tp = type?.personas ?? [];
      if (!selPersonas.some((p) => tp.includes(p))) return false;
    }
    if (skip !== 'etat' && etat !== 'tous') {
      if (etat === 'publie' && !e.publie) return false;
      if (etat === 'masque' && e.publie) return false;
    }
    if (skip !== 'photo' && photo !== 'tous') {
      const has = Boolean(e.thumbnail_url || e.image_url);
      if (photo === 'avec' && !has) return false;
      if (photo === 'sans' && has) return false;
    }
    if (skip !== 'source' && avecSource && !e.source_url) return false;
    return true;
  };

  // Résultats : filtrés puis triés par pertinence (nom > mot-clé > texte
  // libre), à pertinence égale dans l'ordre des types. Collection petite :
  // calcul direct à chaque rendu, sans mémorisation coûteuse.
  const nq = norm(nameQ).trim();
  const results = items
    .filter((i) => passes(i))
    .map((i) => {
      let score = 0;
      if (nq && norm(i.example.titre).includes(nq)) score += 3;
      const kw = i.example.keywords ?? [];
      score += 2 * selKeywords.filter((k) => kw.includes(k)).length;
      if (freeQ.trim()) score += 1;
      if (i.example.user_intent && selIntents.includes(i.example.user_intent)) score += 1;
      return { ...i, score };
    })
    .sort((a, b) => b.score - a.score || a.typePos - b.typePos || a.example.position - b.example.position);

  // Facettes : union des métadonnées présentes dans la collection.
  const kwFreq = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) for (const k of i.example.keywords ?? []) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  const intentFreq = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) {
      const v = i.example.user_intent?.trim();
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [items]);

  const personaFacets = useMemo(
    () => PERSONAS.filter((p) => items.some((i) => (i.type?.personas ?? []).includes(p))),
    [items],
  );

  // Compteurs recalculés sur le sous-ensemble filtré par les AUTRES facettes.
  const baseFor = (skip: Group) => items.filter((i) => passes(i, skip));
  const kwBase = baseFor('keywords');
  const typeBase = baseFor('types');
  const intentBase = baseFor('intents');
  const personaBase = baseFor('personas');

  const hasCriteria = Boolean(
    nameQ.trim() ||
      freeQ.trim() ||
      selKeywords.length ||
      selTypeIds.length ||
      selIntents.length ||
      selPersonas.length ||
      etat !== 'tous' ||
      photo !== 'tous' ||
      avecSource,
  );

  const reset = () => {
    setNameQ('');
    setFreeQ('');
    setSelKeywords([]);
    setSelTypeIds([]);
    setSelIntents([]);
    setSelPersonas([]);
    setEtat('tous');
    setPhoto('tous');
    setAvecSource(false);
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun exemple pour l’instant — importez un lot ou ajoutez-en un depuis la vue « Type ».
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tête de boussole */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
        <p className="flex items-center gap-2 text-sm">
          <Compass className="h-4 w-4 text-primary" />
          <span className="font-medium tabular-nums">
            {results.length} exemple{results.length > 1 ? 's' : ''} répond{results.length > 1 ? 'ent' : ''} présent
            {results.length > 1 ? 's' : ''}
          </span>
        </p>
        {hasCriteria && (
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Tout effacer
          </Button>
        )}
      </div>

      {/* Recherches */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={nameQ}
            onChange={(e) => setNameQ(e.target.value)}
            placeholder="Le nom contient…"
            className="pl-9"
            aria-label="Rechercher dans le nom de l'exemple"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={freeQ}
            onChange={(e) => setFreeQ(e.target.value)}
            placeholder="Un mot dans la description, la légende, l’intention…"
            className="pl-9"
            aria-label="Recherche libre dans les métadonnées"
          />
        </div>
      </div>

      {/* Constellation de facettes */}
      {kwFreq.length > 0 && (
        <div>
          <FacetLabel>Mots-clés</FacetLabel>
          <div className="flex flex-wrap gap-1.5">
            {kwFreq.map(([kw]) => {
              const selected = selKeywords.includes(kw);
              const count = kwBase.filter((i) => (i.example.keywords ?? []).includes(kw)).length;
              return (
                <FacetChip
                  key={kw}
                  active={selected}
                  disabled={!selected && count === 0}
                  count={count}
                  onClick={() => setSelKeywords(toggle(selKeywords, kw))}
                >
                  {kw}
                </FacetChip>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <FacetLabel>Types de jardin</FacetLabel>
        <div className="flex flex-wrap gap-1.5">
          {[...types]
            .sort((a, b) => a.position - b.position)
            .map((t) => {
              const selected = selTypeIds.includes(t.id);
              const count = typeBase.filter((i) => i.example.type_id === t.id).length;
              return (
                <FacetChip
                  key={t.id}
                  active={selected}
                  disabled={!selected && count === 0}
                  count={count}
                  onClick={() => setSelTypeIds(toggle(selTypeIds, t.id))}
                >
                  {t.titre}
                </FacetChip>
              );
            })}
        </div>
      </div>

      {intentFreq.length > 0 && (
        <div>
          <FacetLabel>Ce que le jardinier cherchait</FacetLabel>
          <div className="flex flex-wrap gap-1.5">
            {intentFreq.map(([intent]) => {
              const selected = selIntents.includes(intent);
              const count = intentBase.filter((i) => (i.example.user_intent ?? '').trim() === intent).length;
              return (
                <FacetChip
                  key={intent}
                  active={selected}
                  disabled={!selected && count === 0}
                  count={count}
                  onClick={() => setSelIntents(toggle(selIntents, intent))}
                >
                  « {intent} »
                </FacetChip>
              );
            })}
          </div>
        </div>
      )}

      {personaFacets.length > 0 && (
        <div>
          <FacetLabel>Personas</FacetLabel>
          <div className="flex flex-wrap gap-1.5">
            {personaFacets.map((p) => {
              const selected = selPersonas.includes(p);
              const count = personaBase.filter((i) => (i.type?.personas ?? []).includes(p)).length;
              return (
                <FacetChip
                  key={p}
                  active={selected}
                  disabled={!selected && count === 0}
                  count={count}
                  onClick={() => setSelPersonas(toggle(selPersonas, p))}
                >
                  {PERSONA_LABELS[p]}
                </FacetChip>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <FacetLabel>État & matière</FacetLabel>
        <div className="flex flex-wrap gap-1.5">
          <FacetChip active={etat === 'publie'} onClick={() => setEtat(etat === 'publie' ? 'tous' : 'publie')}>
            Publié
          </FacetChip>
          <FacetChip active={etat === 'masque'} onClick={() => setEtat(etat === 'masque' ? 'tous' : 'masque')}>
            Masqué
          </FacetChip>
          <FacetChip active={photo === 'avec'} onClick={() => setPhoto(photo === 'avec' ? 'tous' : 'avec')}>
            Avec photo
          </FacetChip>
          <FacetChip active={photo === 'sans'} onClick={() => setPhoto(photo === 'sans' ? 'tous' : 'sans')}>
            Sans photo
          </FacetChip>
          <FacetChip active={avecSource} onClick={() => setAvecSource(!avecSource)}>
            Avec source externe
          </FacetChip>
        </div>
      </div>

      {/* Résultats */}
      {!hasCriteria && (
        <p className="text-xs italic text-muted-foreground">
          Posez un premier critère — un mot, un mot-clé, une intention — la Boussole vous oriente.
        </p>
      )}

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun exemple ne répond à ces critères. Effacez-en un pour élargir.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {results.map(({ example, type }, i) => (
            <ExampleVignette
              key={example.id}
              example={example}
              type={type}
              highlight={nameQ}
              onOpen={() => setViewerIndex(i)}
              onEdit={() => onEdit(example)}
              onDelete={() => onDelete(example)}
            />
          ))}
        </div>
      )}

      <GardenExampleViewer
        examples={results.map((r) => r.example)}
        index={viewerIndex}
        onNavigate={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        typeLabel={viewerIndex !== null ? results[viewerIndex]?.type?.titre : undefined}
      />
    </div>
  );
};

export default ExamplesBoussoleView;
