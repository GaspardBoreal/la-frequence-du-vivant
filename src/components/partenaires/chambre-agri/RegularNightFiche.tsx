import React from 'react';
import { DemoFiche, DemoFicheSection } from './DemoFiche';

const SECTIONS: DemoFicheSection[] = [
  {
    titre: 'Ce qui se passe chaque nuit',
    texte: "Dès la tombée du jour, les chauves-souris quittent leur gîte et suivent les haies comme on suivrait une route. La haie les abrite du vent et des rapaces nocturnes, et elle concentre une multitude d'insectes. Une pipistrelle, qui pèse à peine le poids d'un morceau de sucre, peut avaler en une nuit plusieurs centaines de papillons de nuit, dont ceux dont les chenilles s'attaquent à la vigne, aux vergers ou au maïs. C'est une régulation des ravageurs gratuite, silencieuse et sans traitement.",
  },
  {
    titre: 'Comment on le sait',
    texte: "Pour chasser, les chauves-souris émettent des cris trop aigus pour nos oreilles : des ultrasons. Un petit boîtier posé en bordure de haie les enregistre toute la nuit ; chaque passage capté compte pour un « contact ». Un second boîtier, placé en plein champ, sert de témoin : s'il capte beaucoup moins de contacts, c'est que la haie fait le travail. Une station météo WEENAT installée dans la parcelle enregistre en parallèle la température, le vent et la pluie, car les chauves-souris sortent peu sous 10 °C, par vent fort ou sous la pluie. En croisant les deux, on sait quand et où elles chassent.",
  },
  {
    titre: 'Ce que montre l\'animation',
    texte: "Les chauves-souris longent la cime de la haie, là où les insectes se rassemblent. Les compteurs comparent l'activité le long de la haie et en plein champ, puis en déduisent un nombre approximatif d'individus et de ravageurs consommés. Le curseur de température fait varier ces chiffres comme le ferait une vraie nuit d'avril ou de juillet.",
  },
  {
    titre: 'À quoi cela vous sert',
    texte: "Savoir quelles haies travaillent vraiment et lesquelles sont peu fréquentées. Décider où planter, où renforcer, et à quel moment tailler sans déranger. Objectiver la baisse de pression des ravageurs pour ajuster les traitements. Et donner une preuve concrète, chiffrée, de ce que la biodiversité apporte à votre exploitation.",
  },
  {
    titre: 'Pourquoi un chantier régulier',
    texte: "Les chauves-souris sont actives d'avril à octobre. Les boîtiers sont posés plusieurs nuits à chaque passage, et les résultats sont comparés d'une saison à l'autre pour suivre l'effet de vos aménagements dans le temps.",
  },
];

/** Fiche explicative « La haie qui chasse la nuit ». Texte reproduit à l'identique, sans reformulation. */
export const RegularNightFiche: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => (
  <DemoFiche
    open={open}
    onOpenChange={onOpenChange}
    kicker="Chantier Régulier"
    titre="La haie qui chasse la nuit"
    sousTitre="Comment les chauves-souris protègent vos cultures, et comment on le mesure."
    sections={SECTIONS}
    note="Les valeurs affichées dans l'animation sont des ordres de grandeur destinés à comprendre le phénomène, pas des mesures réelles."
  />
);
