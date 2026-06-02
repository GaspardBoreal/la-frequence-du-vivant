import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ShieldCheck, Database, Globe2, Microscope, AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * Panneau "Règles de classification" — explique de façon transparente
 * comment la provenance (pays d'origine) d'une espèce est déterminée.
 * Affichage 100% présentation, aucune logique métier.
 */
const ClassificationRulesPanel: React.FC = () => {
  const [open, setOpen] = useState(false);

  const toneClasses: Record<string, { bubble: string; icon: string; badge: string }> = {
    emerald: { bubble: 'bg-emerald-500/15 ring-emerald-500/30', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    sky: { bubble: 'bg-sky-500/15 ring-sky-500/30', icon: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
    indigo: { bubble: 'bg-indigo-500/15 ring-indigo-500/30', icon: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' },
    amber: { bubble: 'bg-amber-500/15 ring-amber-500/30', icon: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  };

  const steps = [
    {
      icon: ShieldCheck,
      title: '1. POWO — Plants of the World Online (Kew RBG)',
      confidence: 'verified',
      confidenceLabel: 'Vérifié',
      tone: 'emerald',
      desc: "Pour les plantes : pays natifs issus du référentiel POWO du Royal Botanic Gardens, Kew. Les régions TDWG Level 3 sont converties en codes ISO pays. C'est la source la plus rigoureuse, validée par taxonomistes.",
      href: 'https://powo.science.kew.org/',
      hrefLabel: 'powo.science.kew.org',
    },
    {
      icon: Microscope,
      title: '2. GBIF — Type locality',
      confidence: 'high',
      confidenceLabel: 'Haute',
      tone: 'sky',
      desc: "Pays de la localité-type (lieu où le spécimen ayant servi à la description originale de l'espèce a été récolté). Source primaire historique et taxonomiquement décisive.",
      href: 'https://www.gbif.org/',
      hrefLabel: 'gbif.org',
    },
    {
      icon: Database,
      title: '3. GBIF — Distribution stricte',
      confidence: 'high',
      confidenceLabel: 'Haute',
      tone: 'indigo',
      desc: "Pays où l'espèce est documentée avec un establishmentMeans strictement 'NATIVE' ou 'ENDEMIC'. Les statuts 'INTRODUCED', 'NATURALISED', 'INVASIVE' ou vides sont exclus.",
      href: 'https://www.gbif.org/developer/species',
      hrefLabel: 'API GBIF',
    },
    {
      icon: Globe2,
      title: '4. Inféré — Pays du descripteur',
      confidence: 'low',
      confidenceLabel: 'Faible',
      tone: 'amber',
      desc: "Quand aucune source n'est disponible : pays de nationalité du naturaliste qui a décrit l'espèce. Indication historique, jamais affichée comme origine native — signalée comme 'à vérifier'.",
      href: null,
      hrefLabel: null,
    },
  ];

  const exclusions = [
    "Statuts 'INTRODUCED', 'NATURALISED', 'INVASIVE', 'CASUAL' de GBIF",
    "Pays avec establishmentMeans vide ou non renseigné",
    "Checklists nationales sans validation de statut natif",
    "Observations citoyennes brutes (iNaturalist) sans confirmation taxonomique",
  ];

  return (
    <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-slate-500/5 via-transparent to-emerald-500/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 ring-1 ring-emerald-500/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold tracking-tight">Règles de classification des origines</h4>
            <p className="text-xs text-muted-foreground">
              Comment chaque pays d'origine est déterminé · sources scientifiques traçables
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-border/40 pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pour chaque espèce, nous interrogeons une <strong className="text-foreground">cascade hiérarchique</strong> de sources scientifiques.
                La première source qui retourne un résultat fiable fixe l'origine. Le niveau de confiance et la source consultée
                sont affichés sur chaque fiche espèce.
              </p>

              <div className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const tc = toneClasses[step.tone];
                  return (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-border/60 bg-background/40 p-4 flex gap-3"
                    >
                      <div className={`shrink-0 w-9 h-9 rounded-xl ring-1 flex items-center justify-center ${tc.bubble}`}>
                        <Icon className={`w-4 h-4 ${tc.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="text-sm font-semibold">{step.title}</h5>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${tc.badge}`}>
                            {step.confidenceLabel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                        {step.href && (
                          <a
                            href={step.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {step.hrefLabel}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h5 className="text-sm font-semibold">Ce que nous excluons volontairement</h5>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  {exclusions.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <h5 className="text-sm font-semibold mb-2">Niveaux de confiance affichés</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-emerald-500/10 px-2 py-1.5">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300">Vérifié</div>
                    <div className="text-muted-foreground">POWO Kew</div>
                  </div>
                  <div className="rounded-lg bg-sky-500/10 px-2 py-1.5">
                    <div className="font-semibold text-sky-700 dark:text-sky-300">Haute</div>
                    <div className="text-muted-foreground">GBIF strict</div>
                  </div>
                  <div className="rounded-lg bg-indigo-500/10 px-2 py-1.5">
                    <div className="font-semibold text-indigo-700 dark:text-indigo-300">Moyenne</div>
                    <div className="text-muted-foreground">iNat / IUCN</div>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 px-2 py-1.5">
                    <div className="font-semibold text-amber-700 dark:text-amber-300">Faible</div>
                    <div className="text-muted-foreground">Inféré</div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                Une erreur d'identification ? Chaque fiche espèce dispose d'un bouton « Signaler une erreur »
                pour déclencher une révision manuelle.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassificationRulesPanel;
