import React from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckSquare, LineChart, Camera, Sparkles } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { EcoSourceNote } from '../EcoSourceNote';

const GESTES = [
  {
    icon: Eye,
    titre: 'Repérer',
    texte:
      'Parcourez le site et notez les plantes spontanées : celles qui poussent sans avoir été semées. Ce sont elles qui parlent du sol.',
  },
  {
    icon: CheckSquare,
    titre: 'Cocher',
    texte:
      "Dans le tableau de lecture, cochez chaque plante reconnue. Les huit colonnes affichent aussitôt l'intensité de son indication.",
  },
  {
    icon: LineChart,
    titre: 'Lire',
    texte:
      'Additionnez les indices : les colonnes majoritaires dessinent le portrait écologique du lieu, puis la comparaison avec l’Étape 2.',
  },
];

export const IdentifyBriefBlock: React.FC<{ index?: number }> = ({ index = 0 }) => {
  return (
    <AnalyzeCard
      number={0}
      category="Étape 3 · J'identifie la flore en place"
      title="Ce que vous allez faire"
      subtitle="Les plantes qui poussent spontanément sur un site sont des bio-indicatrices : elles renseignent l’humidité, la texture, la richesse et l’acidité du sol."
      index={index}
    >
      <div className="grid md:grid-cols-3 gap-3">
        {GESTES.map((g, i) => (
          <motion.div
            key={g.titre}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 * i }}
            className="relative rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-4 overflow-hidden"
          >
            <span className="absolute -top-3 -right-2 text-[54px] font-serif leading-none text-[hsl(var(--ds-forest))]/8 select-none">
              {i + 1}
            </span>
            <g.icon className="w-5 h-5 text-[hsl(var(--ds-forest))] mb-2" />
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]">
              {g.titre}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">
              {g.texte}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/6 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] uppercase text-[hsl(var(--ds-forest))]">
            <Camera className="w-3.5 h-3.5" /> Identification par photo
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">
            En cas de doute, photographiez la plante entière, puis une feuille et la fleur ou le fruit en gros plan.
            Une application d’identification (PlantNet, iNaturalist) propose une détermination : gardez-la comme
            hypothèse et confirmez-la sur un second individu.
          </p>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--ds-gold))]/40 bg-[hsl(var(--ds-gold))]/8 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.28em] uppercase text-[hsl(var(--ds-earth))]">
            <Sparkles className="w-3.5 h-3.5" /> À garder en tête
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">
            Aucune plante ne donne à elle seule une réponse : c’est le cortège, l’ensemble des espèces présentes,
            qui fait sens. Cherchez les tendances majoritaires, pas la certitude.
          </p>
        </div>
      </div>

      <EcoSourceNote />
    </AnalyzeCard>
  );
};
