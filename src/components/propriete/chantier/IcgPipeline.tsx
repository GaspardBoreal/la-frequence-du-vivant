import React from 'react';
import { ChevronDown, Leaf, Scale, Sigma, Sprout } from 'lucide-react';
import type { IcgReading, SpeciesJuryResult } from '@/lib/chantierIcg';

interface Props {
  reading: IcgReading;
  jury: SpeciesJuryResult;
  observationCount: number;
}

const Step: React.FC<{
  index: number;
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}> = ({ index, icon, title, value, detail, open, onToggle }) => (
  <div className="min-w-0 flex-1">
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
        open
          ? 'border-[#c8a24a] bg-[#c8a24a]/10'
          : 'border-white/12 bg-white/[0.03] hover:border-white/25'
      }`}
    >
      <span className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] opacity-50">
        {icon} Marche {index}
      </span>
      <span className="mt-1 block font-serif text-[22px] leading-none">{value}</span>
      <span className="mt-1 flex items-center gap-1 text-[11px] opacity-70">
        {title}
        <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </span>
    </button>
    {open && (
      <div className="mt-1.5 rounded-2xl border border-white/12 bg-black/20 p-2.5 text-[11.5px] leading-relaxed opacity-85">
        {detail}
      </div>
    )}
  </div>
);

/**
 * « Comment ce chiffre est né » — la chaîne réelle du calcul, en quatre marches.
 * Rien n'est reformulé : chaque marche montre le contenu qui alimente la suivante.
 */
export const IcgPipeline: React.FC<Props> = ({ reading, jury, observationCount }) => {
  const [open, setOpen] = React.useState<number | null>(null);
  const toggle = (i: number) => setOpen((o) => (o === i ? null : i));
  const { detail } = reading;

  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] opacity-55">
        Comment ce chiffre est né
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Step
          index={1}
          icon={<Leaf className="h-3 w-3" />}
          title={`espèce${reading.speciesCount > 1 ? 's' : ''} lue${reading.speciesCount > 1 ? 's' : ''} dans le lot`}
          value={String(reading.speciesCount)}
          open={open === 1}
          onToggle={() => toggle(1)}
          detail={
            <>
              {observationCount} observation{observationCount > 1 ? 's' : ''} retenue
              {observationCount > 1 ? 's' : ''} dans le périmètre géométrique des ouvrages,
              regroupées en {reading.speciesCount} espèce
              {reading.speciesCount > 1 ? 's' : ''} distinctes (dédoublonnage par nom
              scientifique).
            </>
          }
        />
        <Step
          index={2}
          icon={<Sprout className="h-3 w-3" />}
          title={`bio-indicatrice${reading.indicatorCount > 1 ? 's' : ''} reconnue${reading.indicatorCount > 1 ? 's' : ''}`}
          value={String(reading.indicatorCount)}
          open={open === 2}
          onToggle={() => toggle(2)}
          detail={
            <>
              Seules les espèces présentes au référentiel (Flore forestière française, CNPF)
              pèsent sur le score. {jury.unmatched.length} espèce
              {jury.unmatched.length > 1 ? 's' : ''} observée
              {jury.unmatched.length > 1 ? 's' : ''} n'y figure
              {jury.unmatched.length > 1 ? 'nt' : ''} pas : elle
              {jury.unmatched.length > 1 ? 's' : ''} n'influence
              {jury.unmatched.length > 1 ? 'nt' : ''} pas l'ICG.
            </>
          }
        />
        <Step
          index={3}
          icon={<Scale className="h-3 w-3" />}
          title="pôles écologiques confrontés au sol"
          value={`${detail.evaluated}/8`}
          open={open === 3}
          onToggle={() => toggle(3)}
          detail={
            <>
              Chaque pôle reçoit un niveau de lecture 1 à 3 côté flore et côté sol. Même niveau
              = 2 points · un cran d'écart = 1 · deux crans = 0. Une ligne sans donnée sol vaut
              0 mais reste comptée sur 16. Fiabilité de lecture : {detail.reliability} %.
            </>
          }
        />
        <Step
          index={4}
          icon={<Sigma className="h-3 w-3" />}
          title="indice de cohérence globale"
          value={`${detail.icg}/100`}
          open={open === 4}
          onToggle={() => toggle(4)}
          detail={
            <>
              {reading.sentence} Concordances : {detail.counts.oui} · partielles :{' '}
              {detail.counts.partiel} · discordances : {detail.counts.non} · non évaluées :{' '}
              {detail.counts.na}.
            </>
          }
        />
      </div>
    </section>
  );
};

export default IcgPipeline;
