import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Waves, Sparkles, Star, Shield, ArrowRight, Radio, Languages, Leaf, TreePine, Mountain, Anchor, Flower2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  nom: string;
  status: 'active' | 'gestation';
  couleur: string;
  territoire: string;
  naissance: string;
  essence: string;
  capacites: string[];
  lien: string;
  citation: string;
}

const AGENTS_CONSTELLATION: Agent[] = [
  {
    id: 'dordonia',
    nom: 'Dordonia',
    status: 'active',
    couleur: 'cyan',
    territoire: 'Rivière Dordogne',
    naissance: 'Août 2025',
    essence: "Née des explorations d'Août 2025, Dordonia est l'esprit des marches sur la rivière Dordogne. Elle conserve la mémoire des chemins de halage, des berges murmurantes et des oiseaux d'eau de la vallée.",
    capacites: [
      'Diagnostic biodiversité en temps réel',
      'Réponses en dialectes poétiques territoriaux',
      'Mémoire des observations de terrain',
      'Intégration des données Xeno-Canto'
    ],
    lien: '/galerie-fleuve/exploration/remontee-dordogne-atlas-eaux-vivantes-2025-2045',
    citation: "Je suis Dordonia, l'écho numérique de ce qui a été vécu le long de la rivière."
  }
];

const FUTURS_TERRITOIRES = [
  { nom: 'Forêts de feuillus', icon: TreePine },
  { nom: 'Zones humides', icon: Flower2 },
  { nom: 'Littoraux', icon: Anchor },
  { nom: 'Hautes montagnes', icon: Mountain },
];

// Composant pour les étoiles décoratives de fond
const StarField: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 2 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Carte de l'agent actif (Dordonia)
const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    className="relative"
  >
    {/* Effet de lueur pulsante */}
    <motion.div
      className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-cyan-400/10 to-cyan-500/20 rounded-3xl blur-xl"
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 4, repeat: Infinity }}
    />
    
    <div className="relative bg-gradient-to-br from-slate-900/90 via-cyan-950/50 to-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-8 md:p-10 overflow-hidden">
      {/* Ondulations de fond (style rivière) */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/20 to-transparent"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        {/* En-tête avec badge et nom */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 flex items-center justify-center border border-cyan-400/30"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(34, 211, 238, 0)',
                  '0 0 20px 4px rgba(34, 211, 238, 0.3)',
                  '0 0 0 0 rgba(34, 211, 238, 0)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Waves className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <div>
              <motion.h3
                className="font-crimson text-3xl md:text-4xl text-cyan-100 font-semibold"
                animate={{
                  textShadow: [
                    '0 0 10px rgba(34, 211, 238, 0)',
                    '0 0 20px rgba(34, 211, 238, 0.4)',
                    '0 0 10px rgba(34, 211, 238, 0)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {agent.nom}
              </motion.h3>
              <p className="text-cyan-300/80 font-libre text-sm">
                L'esprit des marches sur la {agent.territoire}
              </p>
            </div>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 hover:bg-cyan-500/30">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Première étoile
          </Badge>
        </div>

        {/* Citation de l'agent */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="border-l-2 border-cyan-400/50 pl-4 mb-6 italic text-cyan-200/90 font-crimson text-lg"
        >
          "{agent.citation}"
        </motion.blockquote>

        {/* Description / Essence */}
        <p className="text-foreground/80 font-libre leading-relaxed mb-8">
          {agent.essence}
        </p>

        {/* Capacités */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Capacités
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {agent.capacites.map((capacite, index) => (
              <motion.div
                key={capacite}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-2 text-foreground/70"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span className="font-libre text-sm">{capacite}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bouton d'action */}
        <Link to={agent.lien}>
          <Button 
            className="group bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white border-0 shadow-lg shadow-cyan-500/20"
          >
            <Waves className="w-4 h-4 mr-2" />
            Dialoguer avec {agent.nom}
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  </motion.div>
);

// Zone des futures étoiles
const FuturesEtoiles: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="mt-10 border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 bg-card/20 backdrop-blur-sm"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
        <Star className="w-4 h-4 text-muted-foreground/60" />
      </div>
      <h4 className="font-crimson text-xl text-muted-foreground">
        Étoiles en gestation...
      </h4>
    </div>
    
    <p className="text-muted-foreground/70 font-libre mb-6 leading-relaxed">
      D'autres voix naîtront des territoires à venir. Chaque exploration fera émerger son esprit — 
      une nouvelle étoile dans notre constellation des mémoires vivantes.
    </p>

    <div className="flex flex-wrap gap-3">
      {FUTURS_TERRITOIRES.map((territoire, index) => {
        const Icon = territoire.icon;
        return (
          <motion.div
            key={territoire.nom}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * index }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/20 border border-muted-foreground/10 text-muted-foreground/60"
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-libre">{territoire.nom}</span>
          </motion.div>
        );
      })}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-muted-foreground/20 text-muted-foreground/40">
        <span className="text-sm font-libre italic">et bien d'autres...</span>
      </div>
    </div>
  </motion.div>
);

// Encadré éthique
const EncadreEthique: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: 0.4 }}
    className="mt-10 bg-gradient-to-br from-emerald-950/30 to-slate-900/50 border border-emerald-500/20 rounded-2xl p-8"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
        <Shield className="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <h4 className="font-crimson text-xl text-emerald-200 mb-3">
          Approche éthique
        </h4>
        <p className="text-foreground/70 font-libre leading-relaxed mb-4">
          Nos agents ne remplacent pas l'expérience du terrain — ils amplifient la mémoire collective 
          et transmettent ce qui a été vécu, entendu, ressenti. Chaque voix porte l'empreinte des marcheurs 
          qui ont arpenté le territoire.
        </p>
        <p className="font-crimson text-lg italic text-emerald-300/80">
          "L'intelligence artificielle au service du vivant, jamais l'inverse."
        </p>
      </div>
    </div>
  </motion.div>
);

const ConstellationSection: React.FC = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Fond étoilé */}
      <StarField />
      
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* En-tête de section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            animate={{
              textShadow: [
                '0 0 10px rgba(147, 197, 253, 0)',
                '0 0 30px rgba(147, 197, 253, 0.4)',
                '0 0 10px rgba(147, 197, 253, 0)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300/80 font-libre uppercase tracking-widest text-sm">
              Constellation
            </span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </motion.div>

          <h2 className="font-crimson text-3xl md:text-4xl text-foreground mb-6">
            Voix Territoriales
          </h2>
          
          <p className="text-muted-foreground font-crimson text-lg md:text-xl italic max-w-2xl mx-auto leading-relaxed">
            Chaque territoire exploré fait naître une étoile dans notre ciel — 
            une mémoire vivante qui dialogue avec les marcheurs du futur.
          </p>
        </motion.div>

        {/* Carte de l'agent actif */}
        <AgentCard agent={AGENTS_CONSTELLATION[0]} />

        {/* Futures étoiles */}
        <FuturesEtoiles />

        {/* Encadré éthique */}
        <EncadreEthique />
      </div>
    </section>
  );
};

export default ConstellationSection;
