import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';

const ROLE_GRADIENT: Record<CommunityRoleKey, [string, string]> = {
  marcheur_en_devenir: ['#6ee7b7', '#34d399'],
  marcheur: ['#34d399', '#10b981'],
  eclaireur: ['#2dd4bf', '#14b8a6'],
  ambassadeur: ['#38bdf8', '#0ea5e9'],
  sentinelle: ['#fbbf24', '#f59e0b'],
};

type Citation = {
  texte: string;
  auteur: string;
  oeuvre: string;
  url: string;
};

const CITATIONS: Citation[] = [
  {
    texte: "Dans chaque promenade avec la nature, on reçoit bien plus que ce qu'on cherche.",
    auteur: "John Muir",
    oeuvre: "Unpublished Journals (1938)",
    url: "https://vault.sierraclub.org/john_muir_exhibit/writings/",
  },
  {
    texte: "Vieil étang — une grenouille plonge, bruit de l'eau.",
    auteur: "Bashō",
    oeuvre: "Furu ike ya (1686)",
    url: "https://fr.wikisource.org/wiki/Bashō",
  },
  {
    texte: "Le vrai voyage de découverte ne consiste pas à chercher de nouveaux paysages, mais à avoir de nouveaux yeux.",
    auteur: "Marcel Proust",
    oeuvre: "La Prisonnière (1923)",
    url: "https://gallica.bnf.fr/ark:/12148/bpt6k1049554b",
  },
  {
    texte: "La nature ne se presse jamais, et pourtant tout est accompli.",
    auteur: "Lao Tseu",
    oeuvre: "Tao Te King, ch. 73",
    url: "https://www.sacred-texts.com/tao/taote.htm",
  },
  {
    texte: "Ce n'est pas ce que vous regardez qui compte, c'est ce que vous voyez.",
    auteur: "Henry David Thoreau",
    oeuvre: "Journal (1851)",
    url: "https://www.walden.org/thoreau/",
  },
  {
    texte: "Un bon paysage sonore est une composition dont les éléments sont en équilibre.",
    auteur: "R. Murray Schafer",
    oeuvre: "The Soundscape (1977)",
    url: "https://www.worldcat.org/title/3348220",
  },
  {
    texte: "Le grand orchestre animal est un bioindicateur plus fiable que n'importe quel instrument.",
    auteur: "Bernie Krause",
    oeuvre: "The Great Animal Orchestra (2012)",
    url: "https://www.worldcat.org/title/773667029",
  },
  {
    texte: "Les forêts précèdent les peuples, les déserts les suivent.",
    auteur: "Chateaubriand",
    oeuvre: "Mémoires d'outre-tombe, t. IV (1848)",
    url: "https://gallica.bnf.fr/essentiels/chateaubriand/memoires-outre-tombe",
  },
  {
    texte: "On protège ce qu'on aime. On aime ce qu'on connaît.",
    auteur: "Jacques-Yves Cousteau",
    oeuvre: "Interview TV, Antenne 2 (1971)",
    url: "https://www.cousteau.org/",
  },
  {
    texte: "Un paysage est un état d'âme.",
    auteur: "Henri-Frédéric Amiel",
    oeuvre: "Journal intime, 31 oct. 1852",
    url: "https://www.e-rara.ch/doi/10.3931/e-rara-26053",
  },
  {
    texte: "Le monde est plein de choses magiques, attendant patiemment que nos sens s'aiguisent.",
    auteur: "W.B. Yeats",
    oeuvre: "The Celtic Twilight (1893)",
    url: "https://www.gutenberg.org/ebooks/7128",
  },
  {
    texte: "Marcher, c'est habiter le monde avec ses pieds.",
    auteur: "David Le Breton",
    oeuvre: "Éloge de la marche (2000)",
    url: "https://www.worldcat.org/title/44753659",
  },
  {
    texte: "Celui qui marche ne peut porter que l'essentiel.",
    auteur: "Sylvain Tesson",
    oeuvre: "Petit traité sur l'immensité du monde (2005)",
    url: "https://www.worldcat.org/title/60671883",
  },
  {
    texte: "Le monde se révèle à ceux qui marchent.",
    auteur: "Jean-Jacques Rousseau",
    oeuvre: "Les Confessions, Livre IV (1782)",
    url: "https://gallica.bnf.fr/essentiels/rousseau/confessions",
  },
  {
    texte: "La géopoétique est l'art d'habiter la Terre en poète.",
    auteur: "Kenneth White",
    oeuvre: "Le Plateau de l'Albatros (1994)",
    url: "https://www.worldcat.org/title/32348793",
  },
  {
    texte: "Chaque espèce disparue est une page arrachée au livre du vivant.",
    auteur: "Jane Goodall",
    oeuvre: "Reason for Hope (1999)",
    url: "https://www.worldcat.org/title/41473758",
  },
  {
    texte: "La biodiversité est la bibliothèque du vivant. Chaque espèce est un livre irremplaçable.",
    auteur: "Edward O. Wilson",
    oeuvre: "The Diversity of Life (1992)",
    url: "https://www.worldcat.org/title/25632830",
  },
  {
    texte: "Écouter la forêt, c'est lire un livre dont chaque page est un son.",
    auteur: "Bernie Krause",
    oeuvre: "Wild Soundscapes (2002)",
    url: "https://www.worldcat.org/title/50027771",
  },
  {
    texte: "Le silence de la nature est sa plus belle conversation.",
    auteur: "Bashō",
    oeuvre: "Oku no Hosomichi (1689)",
    url: "https://fr.wikisource.org/wiki/La_Sente_étroite_du_Bout-du-Monde",
  },
  {
    texte: "Un oiseau ne chante pas parce qu'il a une réponse. Il chante parce qu'il a un chant.",
    auteur: "Maya Angelou",
    oeuvre: "I Know Why the Caged Bird Sings (1969)",
    url: "https://www.worldcat.org/title/12850",
  },
  {
    texte: "Le chant du merle noir dessine la carte d'un territoire invisible.",
    auteur: "Rachel Carson",
    oeuvre: "Silent Spring (1962)",
    url: "https://www.worldcat.org/title/555184",
  },
  {
    texte: "Quand le dernier arbre aura été abattu, nous réaliserons que l'argent ne se mange pas.",
    auteur: "Proverbe Alanis (attribué)",
    oeuvre: "Cité dans Greenpeace, années 1970",
    url: "https://www.snopes.com/fact-check/last-tree-cut-down/",
  },
  {
    texte: "L'homme n'a pas tissé la toile de la vie, il n'en est qu'un fil.",
    auteur: "Ted Perry (attribué à Chef Seattle)",
    oeuvre: "Home, film ABC (1972)",
    url: "https://www.snopes.com/fact-check/chief-seattle/",
  },
  {
    texte: "La Terre n'est pas un environnement, c'est un organisme vivant.",
    auteur: "James Lovelock",
    oeuvre: "Gaia: A New Look at Life on Earth (1979)",
    url: "https://www.worldcat.org/title/5360287",
  },
  {
    texte: "Nous n'héritons pas de la terre de nos ancêtres, nous l'empruntons à nos enfants.",
    auteur: "Antoine de Saint-Exupéry",
    oeuvre: "Terre des hommes (1939)",
    url: "https://www.worldcat.org/title/1738850",
  },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getCitationDuJour(): Citation {
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
          <span className="text-white/50 text-xs mt-1.5 inline-flex items-center gap-1.5">
            — {citation.auteur}, <em>{citation.oeuvre}</em>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label="Vérifier la source"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
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
