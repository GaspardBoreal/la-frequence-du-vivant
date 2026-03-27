import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';

const ROLE_GRADIENT: Record<CommunityRoleKey, [string, string]> = {
  marcheur_en_devenir: ['#6ee7b7', '#34d399'],
  marcheur: ['#34d399', '#10b981'],
  eclaireur: ['#2dd4bf', '#14b8a6'],
  ambassadeur: ['#38bdf8', '#0ea5e9'],
  sentinelle: ['#fbbf24', '#f59e0b'],
};

const CITATIONS = [
  { texte: "Le chant du merle noir dessine la carte d'un territoire invisible.", auteur: "Rachel Carson" },
  { texte: "Écouter la forêt, c'est lire un livre dont chaque page est un son.", auteur: "Bernie Krause" },
  { texte: "Chaque promenade dans la nature est une prière.", auteur: "John Muir" },
  { texte: "Le silence de la nature est sa plus belle conversation.", auteur: "Bashō" },
  { texte: "Un oiseau ne chante pas parce qu'il a une réponse. Il chante parce qu'il a un chant.", auteur: "Maya Angelou" },
  { texte: "La nature ne se presse jamais, et pourtant tout est accompli.", auteur: "Lao Tseu" },
  { texte: "Ce n'est pas ce que vous regardez qui compte, c'est ce que vous voyez.", auteur: "Henry David Thoreau" },
  { texte: "Dans chaque promenade avec la nature, on reçoit bien plus que ce qu'on cherche.", auteur: "John Muir" },
  { texte: "Le monde est plein de choses magiques, attendant patiemment que nos sens s'aiguisent.", auteur: "W.B. Yeats" },
  { texte: "La terre ne nous appartient pas, nous appartenons à la terre.", auteur: "Chef Seattle" },
  { texte: "L'homme n'a pas tissé la toile de la vie, il n'en est qu'un fil.", auteur: "Chef Seattle" },
  { texte: "Quand le dernier arbre aura été abattu, nous réaliserons que l'argent ne se mange pas.", auteur: "Proverbe Cree" },
  { texte: "Le vrai voyage de découverte ne consiste pas à chercher de nouveaux paysages, mais à avoir de nouveaux yeux.", auteur: "Marcel Proust" },
  { texte: "Les forêts précèdent les peuples, les déserts les suivent.", auteur: "Chateaubriand" },
  { texte: "Un paysage sonore est le miroir acoustique de la santé d'un écosystème.", auteur: "Bernie Krause" },
  { texte: "Marcher, c'est habiter le monde avec ses pieds.", auteur: "David Le Breton" },
  { texte: "Celui qui marche ne peut porter que l'essentiel.", auteur: "Sylvain Tesson" },
  { texte: "Le monde se révèle à ceux qui marchent.", auteur: "Jean-Jacques Rousseau" },
  { texte: "Écouter le vivant, c'est déjà en prendre soin.", auteur: "Baptiste Morizot" },
  { texte: "L'attention au vivant est une forme de résistance.", auteur: "Baptiste Morizot" },
  { texte: "Vieil étang — une grenouille plonge, bruit de l'eau.", auteur: "Bashō" },
  { texte: "La biodiversité est la bibliothèque du vivant. Chaque espèce est un livre irremplaçable.", auteur: "Edward O. Wilson" },
  { texte: "On protège ce qu'on aime. On aime ce qu'on connaît.", auteur: "Jacques-Yves Cousteau" },
  { texte: "La géopoétique est l'art d'habiter la Terre en poète.", auteur: "Kenneth White" },
  { texte: "Un paysage est un état d'âme.", auteur: "Henri-Frédéric Amiel" },
  { texte: "La vie trouve toujours un chemin.", auteur: "Ian Malcolm" },
  { texte: "Chaque espèce disparue est une page arrachée au livre du vivant.", auteur: "Jane Goodall" },
  { texte: "Le son d'un lieu est son empreinte vivante.", auteur: "R. Murray Schafer" },
  { texte: "Nous ne marchons pas seulement sur la terre, nous marchons avec elle.", auteur: "Gaston Bachelard" },
  { texte: "La beauté sauvage est le dernier langage que la terre nous adresse.", auteur: "François Terrasson" },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getCitationDuJour() {
  const seed = new Date().getFullYear() * 366 + getDayOfYear();
  return CITATIONS[seed % CITATIONS.length];
}

interface FrequenceWaveProps {
  totalFrequences: number;
  role: CommunityRoleKey;
}

const FrequenceWave: React.FC<FrequenceWaveProps> = ({ totalFrequences, role }) => {
  const [c1, c2] = ROLE_GRADIENT[role];
  const citation = getCitationDuJour();
  const bars = 24;
  const heights = Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1);
    const base = Math.sin(x * Math.PI) * 0.7 + 0.3;
    const noise = Math.sin(x * 7) * 0.15 + Math.cos(x * 13) * 0.1;
    return Math.max(0.15, Math.min(1, base + noise));
  });

  return (
    <div className="relative rounded-2xl bg-white/[0.12] border border-white/20 backdrop-blur-lg p-5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />

      {/* Citation du jour */}
      <AnimatePresence mode="wait">
        <motion.div
          key={citation.texte}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative text-center mb-4 px-2"
        >
          <p className="italic text-white/90 text-sm leading-relaxed">
            « {citation.texte} »
          </p>
          <span className="text-white/50 text-xs mt-1.5 block">
            — {citation.auteur}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Onde bioacoustique */}
      <div className="relative flex items-end justify-center gap-[3px] h-20">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full origin-bottom"
            style={{ background: `linear-gradient(to top, ${c1}, ${c2})` }}
            initial={{ scaleY: 0 }}
            animate={{
              scaleY: [h * 0.6, h, h * 0.75, h * 0.9, h * 0.6],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.06,
            }}
            whileHover={{ scaleY: 1.2 }}
          />
        ))}
      </div>

      <div className="relative mt-3 flex items-center justify-between">
        <span className="text-xs text-white/70">Ma Fréquence du jour</span>
        <motion.span
          key={totalFrequences}
          initial={{ scale: 1.3, color: c1 }}
          animate={{ scale: 1, color: '#d1fae5' }}
          className="text-lg font-bold"
        >
          ★ {totalFrequences}
        </motion.span>
      </div>
    </div>
  );
};

export default FrequenceWave;
