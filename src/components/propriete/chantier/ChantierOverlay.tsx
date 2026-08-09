import React from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X, Printer, Hammer, Layers, CalendarDays, Sprout, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { useObjetPhotos } from '@/hooks/propriete/useObjetPhotos';
import {
  useProprieteChantiers,
  useChantierMediaPhases,
  useChantierScenarios,
  type ProprieteChantier,
} from '@/hooks/propriete/useProprieteChantiers';
import { useChantierSpeciesPhases } from '@/hooks/propriete/useChantierSpeciesPhases';
import { resolveSpeciesThumbs } from '@/hooks/useSpeciesThumb';
import { useWaypointFrenchNames } from '@/hooks/propriete/useWaypointFrenchNames';
import { useScenographeState } from '@/components/propriete/scenographe/scenographeStore';

import { soilLiteFromState } from '@/lib/soilLiteFromState';
import { classifyObservations } from '@/lib/ouvrageScope';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import {
  RIGOUR_LABEL,
  cortegeEntries,
  icgDelta,
  isAfterWorks,
  poolFromPlantings,
  poolFromWaypoints,
  poolsFromStatuses,
  readIcg,
  scopeWaypoints,
  speciesIcgJury,
  speciesKey,
  type ChantierRigour,
  type MediaPhase,
  type SpeciesStatus,
} from '@/lib/chantierIcg';

import ChantierLotPicker from './ChantierLotPicker';
import CortegeTriage from './CortegeTriage';
import ProjectionGuide from './ProjectionGuide';
import IcgLadder, { IcgDeltaHero } from './IcgLadder';
import IcgPipeline from './IcgPipeline';
import ChantierScales from './ChantierScales';
import SpeciesJury from './SpeciesJury';
import MediaCurtain, { phasePhotos } from './MediaCurtain';
import ChantierPhotoIntake from './ChantierPhotoIntake';
import ChantierUploadCurtain from './ChantierUploadCurtain';
import ChantierRapportLayout, {
  type RapportSpecies,
} from './print/ChantierRapportLayout';
import { usePrintCombined } from '@/components/propriete/print/usePrintCombined';
import PrintPreparationOverlay from '@/components/propriete/print/PrintPreparationOverlay';

interface Props {
  proprieteId: string;
  objets: ProprieteObjet[];
  propertyName?: string;
  commune?: string | null;
  onClose: () => void;
}

const RIGOURS: ChantierRigour[] = ['strict', 'lisiere', 'voisinage'];

const labelOfObjet = (o: ProprieteObjet) =>
  o.nom?.trim() || TOOL_BY_KEY[o.outil_key]?.label || 'Ouvrage';

/**
 * « Le Chantier » — la démonstration avant / après d'un lot d'ouvrages.
 * Une seule règle : tout ce qui s'affiche ici est restreint au périmètre
 * géométrique réel des ouvrages du lot, jamais à la propriété entière.
 */
export const ChantierOverlay: React.FC<Props> = ({
  proprieteId,
  objets,
  propertyName,
  commune,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const scenoState = useScenographeState();
  /** Le Scénographe vit à z-3000, sous cet écran : on s'efface le temps de son ouverture. */
  const hiddenByScenographe = scenoState.open && scenoState.proprieteId === proprieteId;

  const { chantiers, create, patch, remove } = useProprieteChantiers(proprieteId);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const active = chantiers.find((c) => c.id === activeId) ?? null;

  const [rigour, setRigour] = React.useState<ChantierRigour>('lisiere');
  const [afterMode, setAfterMode] = React.useState<'projete' | 'constate'>('projete');
  const [scenarioId, setScenarioId] = React.useState<string | null>(null);
  const [printFormat, setPrintFormat] = React.useState<'simple' | 'complet' | null>(null);
  const [printing, setPrinting] = React.useState(false);

  const pool = usePropertySpeciesPool(proprieteId);
  const soil = usePropertySoil(proprieteId, { readOnly: true });
  const objetPhotos = useObjetPhotos(proprieteId);
  const { overrides, setPhase } = useChantierMediaPhases(active?.id);
  const lotObjetIds = active?.objet_ids ?? [];
  const scenarios = useChantierScenarios(proprieteId, lotObjetIds);

  const lotObjets = React.useMemo(
    () => objets.filter((o) => lotObjetIds.includes(o.id)),
    [objets, lotObjetIds],
  );
  const geometries = React.useMemo(
    () => lotObjets.map((o) => o.geometry).filter(Boolean),
    [lotObjets],
  );

  /* ---------- A. Les espèces réellement dans le lot ---------- */
  const scoped = React.useMemo(
    () => scopeWaypoints(geometries, pool.waypoints ?? [], rigour),
    [geometries, pool.waypoints, rigour],
  );
  const beforeWaypoints = React.useMemo(
    () => scoped.filter((w) => !isAfterWorks(w.observationDate, active?.date_travaux)),
    [scoped, active?.date_travaux],
  );

  /* ---------- A bis. Le tri du cortège : le statut posé à la main prime ---------- */
  const speciesPhases = useChantierSpeciesPhases(active?.id);
  const workDate = active?.date_travaux ?? null;

  const cortege = React.useMemo(
    () => cortegeEntries(scoped, workDate, speciesPhases.statuses),
    [scoped, workDate, speciesPhases.statuses],
  );

  const pools = React.useMemo(
    () => poolsFromStatuses(scoped, workDate, speciesPhases.statuses),
    [scoped, workDate, speciesPhases.statuses],
  );
  const beforePool = pools.before;
  const afterObservedPool = pools.afterObserved;

  /* ---------- B. Les prélèvements dans le lot ---------- */
  const lotSamples = React.useMemo(() => {
    const samples = (soil.state.samples ?? []).filter(
      (s) => s.lat != null && s.lng != null,
    );
    if (!geometries.length || !samples.length) return [];
    const keep = new Map<string, (typeof samples)[number]>();
    for (const g of geometries) {
      const res = classifyObservations(
        g,
        samples.map((s) => ({ ...s, lat: s.lat as number, lng: s.lng as number })),
        rigour === 'voisinage' ? 15 : 0,
        rigour === 'strict' ? 0 : 3,
      );
      [
        ...res.dedans,
        ...(rigour === 'strict' ? [] : res.lisiere),
        ...(rigour === 'voisinage' ? res.voisinage : []),
      ].forEach((s: any) => keep.set(s.item.id, s.item));
    }
    return Array.from(keep.values());
  }, [soil.state.samples, geometries, rigour]);

  const lotSoil = React.useMemo(
    () =>
      soilLiteFromState(
        lotSamples.length ? { ...soil.state, samples: lotSamples as any } : soil.state,
      ),
    [soil.state, lotSamples],
  );

  /* ---------- C. ICG avant / après ---------- */
  const scenario =
    (scenarios.data ?? []).find((s) => s.id === scenarioId) ?? (scenarios.data ?? [])[0] ?? null;
  const plantings = scenario?.plantings ?? [];

  const before = React.useMemo(() => readIcg(beforePool, lotSoil), [beforePool, lotSoil]);

  const afterPool = React.useMemo(() => {
    if (afterMode === 'projete')
      return plantings.length
        ? [...afterObservedPool, ...poolFromPlantings(plantings)]
        : null;
    return afterObservedPool.length ? afterObservedPool : null;
  }, [afterMode, plantings, afterObservedPool]);

  const after = React.useMemo(
    () => (afterPool ? readIcg(afterPool, lotSoil) : null),
    [afterPool, lotSoil],
  );

  const delta = React.useMemo(
    () => (after ? icgDelta(before.detail, after.detail) : null),
    [before, after],
  );
  const afterLabel = afterMode === 'projete' ? 'Après travaux · projeté' : 'Après travaux · constaté';

  /* ---------- C bis. Le jury des espèces : qui monte, qui descend ---------- */
  const beforeJury = React.useMemo(
    () => speciesIcgJury(beforePool, lotSoil),
    [beforePool, lotSoil],
  );
  const afterJury = React.useMemo(
    () => (afterPool ? speciesIcgJury(afterPool, lotSoil) : null),
    [afterPool, lotSoil],
  );

  /** Aperçu de l'ICG pour un tri encore en brouillon — rien n'est enregistré. */
  const previewIcg = React.useCallback(
    (draft: Record<string, SpeciesStatus>) => {
      const merged = { ...speciesPhases.statuses, ...draft };
      const p = poolsFromStatuses(scoped, workDate, merged);
      const b = readIcg(p.before, lotSoil).detail.icg;
      const afterSim =
        afterMode === 'projete'
          ? plantings.length
            ? readIcg([...p.afterObserved, ...poolFromPlantings(plantings)], lotSoil).detail.icg
            : null
          : p.afterObserved.length
            ? readIcg(p.afterObserved, lotSoil).detail.icg
            : null;
      return { before: b, after: afterSim };
    },
    [speciesPhases.statuses, scoped, workDate, lotSoil, afterMode, plantings],
  );


  /* ---------- D. Médias du lot ---------- */
  const lotPhotos = React.useMemo(
    () => lotObjetIds.flatMap((id) => objetPhotos.byObjet.get(id) ?? []),
    [lotObjetIds, objetPhotos.byObjet],
  );
  const phased = React.useMemo(
    () => phasePhotos(lotPhotos as any, active?.date_travaux ?? null, overrides),
    [lotPhotos, active?.date_travaux, overrides],
  );

  /** Verser des photos depuis Le Chantier : upload au carnet de l'ouvrage,
   *  puis rangement immédiat des nouvelles images dans la phase choisie. */
  const [intakePhase, setIntakePhase] = React.useState<MediaPhase>('avant');
  const [intakeObjetId, setIntakeObjetId] = React.useState<string | null>(null);
  const [filing, setFiling] = React.useState(false);

  const handleIntake = React.useCallback(
    async (objetId: string, phase: MediaPhase, files: File[]) => {
      setIntakePhase(phase);
      setIntakeObjetId(objetId);
      const before = new Set(objetPhotos.photos.map((p) => p.id));
      await objetPhotos.upload(objetId, files);
      setFiling(true);
      try {
        const fresh = (await objetPhotos.refetch()).data ?? [];
        const added = fresh.filter((p) => p.objet_id === objetId && !before.has(p.id));
        for (const p of added) await setPhase(p.id, phase);
        if (added.length) toast.success(`${added.length} image(s) rangée(s) en « ${phase} »`);
      } finally {
        setFiling(false);
      }
    },
    [objetPhotos, setPhase],
  );




  /* ---------- F. Rapport ---------- */
  const inPlaceRaw = React.useMemo<RapportSpecies[]>(
    () =>
      beforePool
        .map((s) => ({
          scientificName: s.scientificName,
          commonName: s.commonName || null,
          photoUrl: s.photos?.[0] ?? null,
          count: s.observations,
        }))
        .sort((a, b) => b.count - a.count),
    [beforePool],
  );

  // Noms vernaculaires FR — même résolveur que L'Herbier du moment
  const nameInput = React.useMemo(
    () => [
      ...inPlaceRaw,
      ...cortege.map((c) => ({
        scientificName: c.scientificName,
        commonName: c.commonName,
      })),
      ...beforeJury.verdicts.map((v) => ({
        scientificName: v.scientificName,
        commonName: v.commonName,
      })),
      ...beforeJury.unmatched,
    ],
    [inPlaceRaw, cortege, beforeJury],
  );
  const { displayNameFor } = useWaypointFrenchNames(nameInput);
  const inPlaceEntries = React.useMemo<RapportSpecies[]>(
    () => inPlaceRaw.map((s) => ({ ...s, commonName: displayNameFor(s) })),
    [inPlaceRaw, displayNameFor],
  );
  const juryNames = React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const v of beforeJury.verdicts) out[v.scientificName] = displayNameFor(v);
    for (const s of beforeJury.unmatched) out[s.scientificName] = displayNameFor(s);
    return out;
  }, [beforeJury, displayNameFor]);




  const thumbNames = React.useMemo(
    () => [
      ...beforePool.map((s) => s.scientificName),
      ...plantings.map((p) => p.scientificName),
    ],
    [beforePool, plantings],
  );

  const print = usePrintCombined({
    active: printing,
    portalId: 'chantier-print-portal',
    bodyClass: 'chantier-print-mode',
    onDone: () => {
      setPrinting(false);
      setPrintFormat(null);
    },
    prepareLabel: 'Recherche des photographies d’espèces',
    prepare: async () => {
      await resolveSpeciesThumbs(thumbNames);
      await queryClient.invalidateQueries({ queryKey: ['species-thumb-batch'] });
      await new Promise((r) => setTimeout(r, 120));
    },
  });

  const launchPrint = (format: 'simple' | 'complet') => {
    setPrintFormat(format);
    setPrinting(true);
  };

  /* ---------- Rendu ---------- */
  const body = (
    <div className="fixed inset-0 z-[3200] flex flex-col bg-[hsl(var(--ds-forest-deep))] text-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-[#c8a24a]" />
          <span className="leading-tight">
            <span className="block text-[9.5px] uppercase tracking-[0.18em] opacity-55">
              Le Chantier · avant / après travaux
            </span>
            <span className="block text-[13px] font-semibold">
              {active ? active.nom : 'Choisir un lot d’ouvrages'}
            </span>
          </span>
        </span>

        {active && (
          <>
            <span className="hidden items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px] sm:inline-flex">
              <Layers className="h-3 w-3 opacity-60" />
              {lotObjets.map(labelOfObjet).join(' · ') || 'lot vide'}
            </span>
            <label className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[11px]">
              <CalendarDays className="h-3 w-3 opacity-60" />
              <input
                type="date"
                value={active.date_travaux ?? ''}
                onChange={(e) => patch(active.id, { date_travaux: e.target.value || null })}
                className="bg-transparent text-[11px] outline-none [color-scheme:dark]"
              />
            </label>
            <div className="flex gap-1">
              {RIGOURS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRigour(r)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    rigour === r
                      ? 'border-[#c8a24a] bg-[#c8a24a]/15 text-[#e7d3a1]'
                      : 'border-white/15 opacity-65 hover:opacity-100'
                  }`}
                >
                  {RIGOUR_LABEL[r]}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {active && (
            <>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] opacity-80 hover:opacity-100"
              >
                Changer de lot
              </button>
              <button
                type="button"
                onClick={() => launchPrint('simple')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11.5px]"
              >
                <Printer className="h-3.5 w-3.5" /> Rapport simple
              </button>
              <button
                type="button"
                onClick={() => launchPrint('complet')}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#c8a24a] bg-[#c8a24a]/15 px-3 py-1.5 text-[11.5px] text-[#e7d3a1]"
              >
                <Printer className="h-3.5 w-3.5" /> Dossier complet
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer Le Chantier"
            className="rounded-full border border-white/15 p-1.5 opacity-80 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!active ? (
          <div className="mx-auto max-w-[860px]">
            <ChantierLotPicker
              objets={objets}
              chantiers={chantiers}
              onOpen={(c: ProprieteChantier) => setActiveId(c.id)}
              onCreate={async (input) => {
                const created = await create(input);
                if (created?.id) setActiveId(created.id);
              }}
              onDelete={(id) => {
                void remove(id);
                if (activeId === id) setActiveId(null);
              }}
              onClose={onClose}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-[1180px] space-y-4">
            <IcgDeltaHero
              before={before}
              after={after}
              delta={delta}
              afterLabel={afterLabel}
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(['projete', 'constate'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAfterMode(m)}
                    className={`rounded-full border px-3 py-1.5 text-[11.5px] transition ${
                      afterMode === m
                        ? 'border-[#c8a24a] bg-[#c8a24a]/15 text-[#e7d3a1]'
                        : 'border-white/15 opacity-65 hover:opacity-100'
                    }`}
                  >
                    {m === 'projete' ? 'Après projeté (scénario)' : 'Après constaté (re-relevé)'}
                  </button>
                ))}
              </div>
              {afterMode === 'projete' && (scenarios.data?.length ?? 0) > 0 && (
                <select
                  value={scenario?.id ?? ''}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[11.5px] [&>option]:text-black"
                >
                  {(scenarios.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              )}
              {afterMode === 'projete' && plantings.length > 0 && (
                <ProjectionGuide
                  ouvrages={lotObjets.map((o) => ({ id: o.id, label: labelOfObjet(o) }))}
                  hasScenario
                  scenarioId={scenario?.id ?? null}
                  scenarioObjetId={scenario?.objet_id ?? null}
                />
              )}

              {afterMode === 'constate' && !active.date_travaux && (
                <span className="text-[11.5px] italic opacity-60">
                  Fixez la date des travaux pour distinguer les relevés d’après.
                </span>
              )}
            </div>

            {afterMode === 'projete' && !plantings.length && (
              <ProjectionGuide
                ouvrages={lotObjets.map((o) => ({ id: o.id, label: labelOfObjet(o) }))}
                hasScenario={false}
              />
            )}



            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] opacity-55">
                  Avant travaux · {beforePool.length} espèce{beforePool.length > 1 ? 's' : ''} ·{' '}
                  {before.indicatorCount} bio-indicatrice{before.indicatorCount > 1 ? 's' : ''}
                </p>
                <IcgLadder reading={before} />
              </section>
              <section className="rounded-2xl border border-[#c8a24a]/30 bg-[#c8a24a]/[0.05] p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] opacity-55">
                  {afterLabel}
                </p>
                {after ? (
                  <IcgLadder reading={after} delta={delta} />
                ) : (
                  <p className="px-2 py-6 text-center text-[12px] italic opacity-60">
                    Rien à comparer pour l’instant.
                  </p>
                )}
              </section>
            </div>

            <ChantierScales
              before={before.detail}
              after={after ? after.detail : null}
              afterLabel={afterLabel}
            />

            <IcgPipeline
              reading={before}
              jury={beforeJury}
              observationCount={beforeWaypoints.length}
            />

            <SpeciesJury
              jury={beforeJury}
              title="Le jury des espèces · avant travaux"
            />

            {afterJury && (
              <SpeciesJury jury={afterJury} title={`Le jury des espèces · ${afterLabel}`} />
            )}



            <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] opacity-55">
                <FlaskConical className="h-3 w-3" /> Prélèvements du lot · {lotSamples.length}
              </p>
              {lotSamples.length === 0 ? (
                <p className="text-[12px] italic opacity-60">
                  Aucun prélèvement géolocalisé dans ce périmètre : la lecture du sol reste celle
                  de la propriété.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {lotSamples.map((s) => (
                    <li key={s.id} className="rounded-xl border border-white/12 px-3 py-2">
                      <p className="text-[12.5px] font-semibold">Prélèvement {s.label}</p>
                      <p className="text-[11px] opacity-65">
                        {[
                          s.structure_result && `structure ${s.structure_result}`,
                          s.texture_result && `texture ${s.texture_result}`,
                          s.ph_value != null && `pH ${s.ph_value}`,
                          s.worm_count != null && `${s.worm_count} vers`,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'tests à compléter'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <CortegeTriage
              entries={cortege}
              labelFor={(e) => displayNameFor(e)}
              saved={speciesPhases.statuses}
              preview={previewIcg}
              jury={beforeJury}
              onCommit={(changes) => speciesPhases.commit(changes)}
              onResetAll={() => void speciesPhases.resetAll()}
            />



            <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
              <ChantierPhotoIntake
                ouvrages={lotObjets.map((o) => ({ id: o.id, label: labelOfObjet(o) }))}
                busy={!!objetPhotos.progress || filing}
                progress={objetPhotos.progress}
                onUpload={handleIntake}
              />
              <ChantierUploadCurtain
                items={objetPhotos.uploads}
                phase={intakePhase}
                filing={filing}
                ouvrageLabel={
                  lotObjets.find((o) => o.id === intakeObjetId)
                    ? labelOfObjet(lotObjets.find((o) => o.id === intakeObjetId)!)
                    : undefined
                }
                onClose={objetPhotos.clearUploads}
              />

              <MediaCurtain
                photos={phased}
                onPhase={(id, phase: MediaPhase) => {
                  void setPhase(id, phase);
                  toast.success(`Photographie rangée en « ${phase} »`);
                }}
              />
            </section>
          </div>
        )}
      </div>

      <PrintPreparationOverlay
        visible={printing}
        progress={print.progress}
        steps={print.steps}
        skipped={print.skipped}
        incomplete={print.incomplete}
        onRetryMissing={print.retryMissing}
        onPrintAnyway={print.printAnyway}
        onCancel={print.cancel}
      />
      {printing &&
        printFormat &&
        active &&
        print.portalRef.current &&
        createPortal(
          <ChantierRapportLayout
            propertyName={propertyName}
            commune={commune}
            chantierNom={active.nom}
            ouvrages={lotObjets.map(labelOfObjet)}
            dateTravaux={active.date_travaux}
            rigourLabel={RIGOUR_LABEL[rigour]}
            soilSentence={
              [
                lotSoil.structure && `structure ${lotSoil.structure}`,
                lotSoil.texture && `texture ${lotSoil.texture}`,
                lotSoil.ph != null && `pH ${lotSoil.ph}`,
              ]
                .filter(Boolean)
                .join(' · ') || 'sol non renseigné'
            }
            before={before}
            after={after}
            afterLabel={afterLabel}
            delta={delta}
            inPlace={inPlaceEntries}
            plantings={plantings}
            photos={phased as any}
            jury={beforeJury}
            juryNames={juryNames}
            options={{ format: printFormat }}
          />,
          print.portalRef.current,
        )}
    </div>
  );

  if (hiddenByScenographe) return null;

  return createPortal(body, document.body);
};

export default ChantierOverlay;
