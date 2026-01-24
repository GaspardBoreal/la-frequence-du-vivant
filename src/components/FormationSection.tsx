import React from 'react';
import { motion } from 'framer-motion';
import { Footprints, Users, GraduationCap, Clock, Target, Compass, Sunrise, TreeDeciduous, Building2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface NiveauFormation {
  niveau: string;
  presentiel: number;
  distanciel: number;
  total: number;
  objectif: string;
}

interface ProfilFormation {
  id: string;
  profil: string;
  icon: React.ElementType;
  description: string;
  color: string;
  niveaux: NiveauFormation[];
  competences?: string[];
}

const PARCOURS_FORMATION: ProfilFormation[] = [
  {
    id: 'marcheur',
    profil: 'Marcheur du vivant',
    icon: Footprints,
    description: 'Pratique individuelle, autonome',
    color: 'emerald',
    niveaux: [
      { niveau: 'Marche unitaire', presentiel: 1, distanciel: 1, total: 2, objectif: 'Être autonome pour vivre et documenter une marche' },
      { niveau: 'Exploration (≥3 marches)', presentiel: 2, distanciel: 2, total: 4, objectif: 'Relier plusieurs marches dans un récit sensible' }
    ]
  },
  {
    id: 'ambassadeur',
    profil: 'Ambassadeur',
    icon: Users,
    description: 'Transmission à de petits groupes',
    color: 'cyan',
    niveaux: [
      { niveau: 'Marche unitaire', presentiel: 2, distanciel: 1, total: 3, objectif: 'Guider un groupe et poser un cadre' },
      { niveau: 'Exploration (≥3 marches)', presentiel: 3, distanciel: 2, total: 5, objectif: 'Transmettre une expérience complète et cohérente' }
    ],
    competences: ['Animation de groupe', 'Narration et intention', 'Sécurité et logistique', 'Qualité d\'expérience']
  },
  {
    id: 'animateur',
    profil: 'Animateur de résidence',
    icon: GraduationCap,
    description: 'Formation, orchestration, garantie de la méthode',
    color: 'purple',
    niveaux: [
      { niveau: 'Marche unitaire', presentiel: 3, distanciel: 2, total: 5, objectif: 'Former des ambassadeurs' },
      { niveau: 'Exploration (≥3 marches)', presentiel: 4, distanciel: 3, total: 7, objectif: 'Tenir une résidence complète' }
    ],
    competences: ['Pédagogie et progression', 'Évaluation et certification', 'Orchestration de résidences', 'Transmission de la culture des Marches']
  }
];

const SOCLE_COMMUN = [
  { label: 'Posture', value: 'Lenteur, silence actif, éthique du vivant' },
  { label: 'Outils', value: 'Carnet, Merlin, Seek, spectrogramme, la-frequence-du-vivant.com' },
  { label: 'Protocole', value: 'Protocole de marche sensible' },
  { label: 'Production', value: 'Traces sensibles (texte, audio, photo)' }
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' }
  };
  return colors[color] || colors.emerald;
};

const ProfilCard: React.FC<{ profil: ProfilFormation; delay: number }> = ({ profil, delay }) => {
  const Icon = profil.icon;
  const colors = getColorClasses(profil.color);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl p-5 border ${colors.border} ${colors.bg} backdrop-blur-sm`}
    >
      <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mb-4`}>
        <Icon className={`h-6 w-6 ${colors.text}`} />
      </div>
      <h4 className="font-crimson text-lg text-foreground mb-1">{profil.profil}</h4>
      <p className="text-sm text-muted-foreground">{profil.description}</p>
    </motion.div>
  );
};

const FormationSection: React.FC = () => {
  return (
    <section className="relative z-10 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 3 Profils de marcheurs */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {PARCOURS_FORMATION.map((profil, index) => (
            <ProfilCard key={profil.id} profil={profil} delay={0.1 + index * 0.1} />
          ))}
        </div>

        {/* Accordéon des parcours */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <h3 className="font-crimson text-xl text-foreground mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            Parcours de formation
          </h3>
          
          <Accordion type="single" collapsible className="space-y-2">
            {PARCOURS_FORMATION.map((profil) => {
              const Icon = profil.icon;
              const colors = getColorClasses(profil.color);
              
              return (
                <AccordionItem
                  key={profil.id}
                  value={profil.id}
                  className={`border ${colors.border} rounded-lg overflow-hidden`}
                >
                  <AccordionTrigger className={`px-4 py-3 hover:no-underline hover:${colors.bg}`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                      <span className="font-medium text-foreground">{profil.profil}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {profil.niveaux[0].total}–{profil.niveaux[1].total} jours
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {profil.niveaux.map((niveau, idx) => (
                        <div key={idx} className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-foreground">{niveau.niveau}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className={`text-sm font-semibold ${colors.text}`}>{niveau.total}j</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {niveau.presentiel}j présentiel + {niveau.distanciel}j distanciel
                          </div>
                          <p className="text-sm text-muted-foreground italic">
                            → {niveau.objectif}
                          </p>
                        </div>
                      ))}
                      
                      {profil.competences && (
                        <div className="pt-2 border-t border-border/20">
                          <p className="text-xs text-muted-foreground mb-2">Compétences spécifiques :</p>
                          <div className="flex flex-wrap gap-2">
                            {profil.competences.map((comp, idx) => (
                              <span key={idx} className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Règle Exploration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12 p-6 rounded-xl bg-gradient-to-br from-purple-950/30 via-cyan-950/20 to-emerald-950/20 border border-purple-500/20"
        >
          <h4 className="font-crimson text-lg text-foreground mb-4 flex items-center gap-2">
            <Compass className="h-5 w-5 text-purple-400" />
            Règle de l'Exploration
          </h4>
          <p className="text-foreground font-medium mb-4">
            Exploration = <span className="text-purple-400">3 marches</span> + <span className="text-cyan-400">3 traces</span>
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sunrise className="h-4 w-4 text-amber-400" />
              <span>Aube ou crépuscule</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TreeDeciduous className="h-4 w-4 text-emerald-400" />
              <span>Eau / forêt / champs</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>Milieu anthropisé</span>
            </div>
          </div>
        </motion.div>

        {/* Socle commun */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-12 p-6 rounded-xl border border-border/20 bg-muted/5"
        >
          <h4 className="font-crimson text-lg text-foreground mb-4">Socle commun de formation</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCLE_COMMUN.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider w-20 shrink-0">
                  {item.label}
                </span>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default FormationSection;
