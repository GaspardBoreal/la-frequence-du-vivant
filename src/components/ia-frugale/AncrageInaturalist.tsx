import { useMemo, useState } from 'react';
import { Wand2, Globe2, Footprints, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';
import { useInatVolumes } from '@/hooks/iaFrugale/useInatVolumes';
import {
  INAT_PUBLIE,
  INAT_REPLI,
  INFERENCE_DEFAUTS,
  PREREGLAGE_INAT,
  SOURCE_INAT_API,
  SOURCE_INAT_MODELE,
  SOURCE_INAT_TRAINING,
  SOURCE_RTX8000,
} from '@/content/iaFrugale/inaturalistReel';
import { calculCodeCarbon, ciDuPays, fmt, nomDuPays } from '@/content/iaFrugale/outilsMesure';
import type { Valeurs } from '@/content/iaFrugale/casUsage';
import SourceNote from './SourceNote';

interface Props {
  valeurs: Valeurs;
  setValeurs: (maj: (p: Valeurs) => Valeurs) => void;
}

const nb = (v: number, d = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: d });

export const AncrageInaturalist = ({ valeurs, setValeurs }: Props) => {
  const { data: stats } = usePublicGlobalStats();
  const { data: inat, isLoading } = useInatVolumes();

  const [photosParMois, setPhotosParMois] = useState<number>(INFERENCE_DEFAUTS.photosParMois);
  const [msParPhoto, setMsParPhoto] = useState<number>(INFERENCE_DEFAUTS.msParPhoto);

  const ci = ciDuPays(String(valeurs.pays));

  /** Entraînement, avec les réglages actuels des curseurs de la carte. */
  const entrainement = useMemo(
    () =>
      calculCodeCarbon({
        heures: Number(valeurs.heures),
        puissanceCpu: Number(valeurs.cpu),
        chargeCpu: 0.5,
        puissanceGpu: Number(valeurs.gpu),
        chargeGpu: Number(valeurs.chargeGpu) / 100,
        ramGo: Number(valeurs.ram),
        ci,
      }),
    [valeurs, ci],
  );

  /** Identification : même moteur CodeCarbon, appliqué à un temps machine court. */
  const inference = useMemo(() => {
    const heures = (photosParMois * msParPhoto) / 1000 / 3600;
    return calculCodeCarbon({
      heures,
      puissanceCpu: 0,
      chargeCpu: 0,
      puissanceGpu: INFERENCE_DEFAUTS.puissanceServeurW,
      chargeGpu: 1,
      ramGo: 64,
      ci,
    });
  }, [photosParMois, msParPhoto, ci]);

  const moisDeBascule = inference.gco2 > 0 ? entrainement.gco2 / inference.gco2 : Infinity;
  const partInference = Math.max(0, Math.min(100, (12 * inference.gco2 / (entrainement.gco2 + 12 * inference.gco2)) * 100));

  const obsMonde = inat?.observationsMonde ?? INAT_REPLI.observationsMonde;
  const obsMarches = stats?.observations_citoyennes ?? 0;
  const especesMarches = stats?.especes_tracees ?? 0;
  const rapport = obsMarches > 0 ? obsMonde / obsMarches : null;

  const gParPhoto = entrainement.gco2 / INAT_PUBLIE.photosEntrainement;

  const appliquerPreset = () =>
    setValeurs((p) => ({ ...p, ...PREREGLAGE_INAT }));

  return (
    <section className="space-y-6 border-t border-border bg-muted/20 p-5 sm:p-6">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--accent-outil))]">
          Et dans la vraie vie ?
        </p>
        <h4 className="text-base font-semibold text-foreground">
          Comparer avec iNaturalist, honnêtement
        </h4>
        <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--accent-outil))]" aria-hidden />
          <span>
            L'API d'iNaturalist ne renvoie <strong className="font-medium text-foreground">aucune</strong> donnée
            d'énergie ni de CO2 : elle renvoie des volumes. On ne peut donc pas lui demander un résultat à
            comparer chiffre pour chiffre. Ce que l'on peut faire, et qui est vérifiable : reprendre le matériel
            qu'iNaturalist publie, et y brancher les volumes réels.
          </span>
        </p>
      </header>

      {/* 1 — Préréglage */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">Les réglages réels d'iNaturalist</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {INAT_PUBLIE.nbGpu} × {INAT_PUBLIE.gpuModele} ({INAT_PUBLIE.gpuWatts} W par carte, fiche
              technique NVIDIA), {INAT_PUBLIE.dureeMois} mois d'entraînement, {nb(INAT_PUBLIE.photosEntrainement)} photos
              et {nb(INAT_PUBLIE.taxonsCeBillet)} taxons.
            </p>
          </div>
          <Button type="button" size="sm" className="gap-1.5" onClick={appliquerPreset}>
            <Wand2 className="h-3.5 w-3.5" aria-hidden />
            Appliquer aux curseurs
          </Button>
        </div>
        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          Restent des hypothèses, car iNaturalist ne les publie pas : le pays d'hébergement (vous êtes
          actuellement sur « {nomDuPays(String(valeurs.pays))} »), l'efficacité du centre de données, la
          référence exacte du processeur et la quantité de mémoire.
        </p>
      </div>

      {/* 2 — Volumes côte à côte */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Footprints className="h-3.5 w-3.5" aria-hidden /> Vos marches
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {nb(obsMarches)}
          </p>
          <p className="text-xs text-muted-foreground">
            observations · {nb(especesMarches)} espèces suivies
          </p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--accent-outil)/0.35)] bg-[hsl(var(--accent-outil)/0.07)] p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" aria-hidden /> iNaturalist, monde entier
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[hsl(var(--accent-outil))]">
            {isLoading ? '…' : nb(obsMonde)}
          </p>
          <p className="text-xs text-muted-foreground">
            observations · {nb(INAT_PUBLIE.taxonsModeleCourant)} taxons dans le modèle{' '}
            {INAT_PUBLIE.modeleVersion}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {inat?.repli
              ? `Valeur relevée le ${INAT_REPLI.releveLe} — l'API n'a pas répondu.`
              : "Chiffre récupéré à l'instant depuis l'API publique."}
          </p>
        </div>
      </div>

      <ul className="space-y-2 rounded-xl border border-border bg-card p-4">
        {rapport && (
          <li className="text-sm leading-relaxed text-foreground/85">
            Le monde entier pèse <strong className="font-medium">{nb(rapport)} fois</strong> vos marches :
            c'est l'ordre de grandeur qui sépare une collecte de terrain d'un jeu d'entraînement.
          </li>
        )}
        <li className="text-sm leading-relaxed text-foreground/85">
          Rapporté aux {nb(INAT_PUBLIE.photosEntrainement)} photos apprises, votre réglage donne{' '}
          <strong className="font-medium">{fmt(gParPhoto * 1000, 3)} mgCO2eq par photo apprise</strong> — la
          grandeur qui se transporte d'un projet à l'autre.
        </li>
        <li className="text-sm leading-relaxed text-foreground/85">
          Un taxon entre dans le modèle à partir de {INAT_PUBLIE.seuilPhotos} photos et{' '}
          {INAT_PUBLIE.seuilObservations} observations, et le modèle est réentraîné tous les un à deux mois :
          l'entraînement n'est pas un événement unique.
        </li>
      </ul>

      {/* 3 — Entraîner une fois, identifier un million de fois */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Entraîner une fois, identifier un million de fois
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Aucune identification n'est envoyée à iNaturalist : leur point d'entrée de reconnaissance d'image
            demande un compte authentifié. Ce volet est un calcul, avec le même moteur CodeCarbon, sur des
            volumes que vous réglez.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="inat-photos" className="text-sm text-foreground">
              Photos identifiées par mois
              <span className="ml-1.5 align-middle text-[10px] uppercase tracking-wider text-muted-foreground">
                hypothèse
              </span>
            </label>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums">
              {nb(photosParMois)}
            </span>
          </div>
          <Slider
            id="inat-photos"
            value={[photosParMois]}
            min={100_000}
            max={50_000_000}
            step={100_000}
            onValueChange={([v]) => setPhotosParMois(v)}
            aria-label="Photos identifiées par mois"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="inat-ms" className="text-sm text-foreground">
              Temps machine par photo
              <span className="ml-1.5 align-middle text-[10px] uppercase tracking-wider text-muted-foreground">
                hypothèse
              </span>
            </label>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums">
              {nb(msParPhoto)} ms
            </span>
          </div>
          <Slider
            id="inat-ms"
            value={[msParPhoto]}
            min={10}
            max={500}
            step={10}
            onValueChange={([v]) => setMsParPhoto(v)}
            aria-label="Temps machine par photo"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Serveur d'identification supposé à {INFERENCE_DEFAUTS.puissanceServeurW} W pendant ce temps-là.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Entraînement, une fois</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {fmt(entrainement.gco2 / 1000)} <span className="text-xs font-normal">kgCO2eq</span>
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Identifications, par mois</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {fmt(inference.gco2 / 1000)} <span className="text-xs font-normal">kgCO2eq</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Part des identifications sur un an : ${Math.round(partInference)} %`}
          >
            <div
              className="h-full bg-[hsl(var(--accent-outil))] transition-all duration-500"
              style={{ width: `${100 - partInference}%` }}
            />
            <div
              className="h-full bg-[hsl(var(--accent-outil)/0.35)] transition-all duration-500"
              style={{ width: `${partInference}%` }}
            />
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            Sur douze mois, les identifications pèsent{' '}
            <strong className="font-medium">{fmt(partInference, 1)} %</strong> du total.{' '}
            {Number.isFinite(moisDeBascule) && (
              <>
                Le service d'identification rattrape le coût de l'entraînement au bout de{' '}
                <strong className="font-medium">{fmt(moisDeBascule, 1)} mois</strong>.
              </>
            )}
          </p>
        </div>
      </div>

      <SourceNote
        titre="Sources de cet ancrage"
        sources={[
          SOURCE_INAT_TRAINING,
          SOURCE_INAT_MODELE,
          SOURCE_INAT_API,
          SOURCE_RTX8000,
          INAT_REPLI.source,
        ]}
      />
    </section>
  );
};

export default AncrageInaturalist;
