import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Microscope, Sparkles, Wind, Compass, Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FAMILY_META } from '@/lib/apiMcpFamilies';
import type { ApiMcpEntry } from '@/hooks/useApiMcpRegistry';
import type { ApiMcpHealth } from '@/hooks/useApiMcpHealth';
import { formatVolume, formatFreshness } from '@/hooks/useApiMcpHealth';
import DataFlowConstellation from './DataFlowConstellation';

interface Props {
  entry: ApiMcpEntry | null;
  health?: ApiMcpHealth;
  open: boolean;
  onClose: () => void;
}

const CHAPTERS = [
  { id: 'birth', label: 'Naissance', icon: Sparkles },
  { id: 'journey', label: 'Voyage', icon: Wind },
  { id: 'landing', label: 'Atterrissage', icon: Compass },
  { id: 'impact', label: 'Impact', icon: Heart },
];

const ApiStoryDrawer: React.FC<Props> = ({ entry, health, open, onClose }) => {
  const [showTech, setShowTech] = useState(false);

  if (!entry) return null;
  const fam = FAMILY_META[entry.family];
  const impactText = (entry.metric_queries?.impact?.template ?? '')
    .replace('{volume}', formatVolume(health?.volume ?? null));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 overflow-y-auto bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border-l border-emerald-400/20"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-emerald-950/80 backdrop-blur border border-emerald-400/30 flex items-center justify-center text-emerald-200 hover:bg-emerald-800 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero */}
        <div className="relative h-64 overflow-hidden">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2 }}
            src={fam.hero}
            alt=""
            width={1536}
            height={832}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">
              {fam.label}
            </div>
            <h2 className="text-3xl font-serif text-emerald-50 leading-tight">{entry.name}</h2>
            <p className="text-emerald-100/80 italic mt-2 text-sm">« {entry.tagline} »</p>
          </div>
        </div>

        {/* Chapters nav */}
        <div className="sticky top-0 z-10 px-6 py-3 flex gap-2 overflow-x-auto bg-emerald-950/95 backdrop-blur border-b border-emerald-400/10">
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#chap-${c.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-emerald-200/70 hover:text-emerald-100 hover:bg-emerald-800/50 transition-colors whitespace-nowrap"
            >
              <c.icon className="w-3 h-3" />
              {c.label}
            </a>
          ))}
        </div>

        <div className="px-6 py-8 space-y-12">
          {/* Chap 1 — Naissance */}
          <motion.section
            id="chap-birth"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Chapitre 1 — Naissance</span>
            </div>
            <p className="text-emerald-50 text-base leading-relaxed">
              {entry.simple_description}
            </p>
          </motion.section>

          {/* Chap 2 — Voyage */}
          <motion.section
            id="chap-journey"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <Wind className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Chapitre 2 — Voyage</span>
            </div>
            <p className="text-sm text-emerald-100/80">
              Le chemin que la donnée emprunte, depuis sa source jusqu'à votre écran.
            </p>
            <DataFlowConstellation steps={entry.flow_steps} />
            <ol className="space-y-2 mt-4">
              {entry.flow_steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-emerald-100 font-medium">{s.label}</div>
                    <div className="text-emerald-200/60 text-xs">{s.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </motion.section>

          {/* Chap 3 — Atterrissage */}
          <motion.section
            id="chap-landing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <Compass className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Chapitre 3 — Atterrissage</span>
            </div>
            <p className="text-sm text-emerald-100/80">
              Voici où cette donnée se manifeste dans l'application :
            </p>
            {entry.live_screen_path && (
              <Link
                to={entry.live_screen_path}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-sm transition-colors"
              >
                Voir en vrai
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </motion.section>

          {/* Chap 4 — Impact */}
          <motion.section
            id="chap-impact"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <Heart className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Chapitre 4 — Impact</span>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-400/15 to-emerald-700/5 border border-emerald-400/20 p-5">
              <div className="text-2xl font-serif text-emerald-50 leading-snug">
                {impactText || 'Cette intégration nourrit silencieusement vos marches.'}
              </div>
              {health?.freshness && (
                <div className="text-xs text-emerald-200/60 mt-3">
                  Dernière mise à jour : {formatFreshness(health.freshness)}
                </div>
              )}
            </div>
          </motion.section>

          {/* Aller plus loin */}
          {entry.tech_description && (
            <Collapsible open={showTech} onOpenChange={setShowTech}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-emerald-200 hover:text-emerald-100 hover:bg-emerald-800/40"
                >
                  <Microscope className="w-4 h-4 mr-2" />
                  {showTech ? 'Replier' : 'Aller plus loin (technique)'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 rounded-xl bg-emerald-950/60 border border-emerald-400/10 p-4">
                <p className="text-xs text-emerald-200/80 leading-relaxed font-mono">
                  {entry.tech_description}
                </p>
                {entry.external_doc_url && entry.external_doc_url !== '#' && (
                  <a
                    href={entry.external_doc_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-300 hover:text-emerald-200"
                  >
                    Documentation officielle
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApiStoryDrawer;
