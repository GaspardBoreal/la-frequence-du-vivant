import React from 'react';
import { DemoFiche, DemoFicheSection } from './DemoFiche';

const SECTIONS: DemoFicheSection[] = [
  {
    titre: 'Ce qui se passe dans la journée',
    texte: "Abeilles, bourdons, syrphes et papillons ne volent pas à toute heure. Il leur faut de la lumière, de la chaleur et un air assez calme. L'abeille domestique reste à la ruche tant qu'il fait frais ; le bourdon, plus gros et plus velu, sort dès les premières heures fraîches. Quand le vent se lève ou que la pluie arrive, tout s'arrête. Au fil d'une même journée, la parcelle s'ouvre et se ferme donc aux pollinisateurs, parfois plusieurs fois.",
  },
  {
    titre: 'Et les espèces invasives ?',
    texte: "Certaines plantes venues d'ailleurs prennent la place de la flore locale. Elles ne posent pas toutes le même problème. L'ambroisie est pollinisée par le vent : les insectes l'ignorent, mais son pollen est très allergisant et sa destruction avant floraison est obligatoire. La renouée du Japon, elle, attire beaucoup les abeilles en fin d'été, mais elle étouffe les autres fleurs et appauvrit la diversité dont les pollinisateurs ont besoin le reste de l'année. Le baccharis envahit les marais et les fossés littoraux.",
  },
  {
    titre: 'Comment on le sait',
    texte: "Une station météo installée dans la parcelle mesure heure par heure la température, le vent et la pluie. En croisant ces mesures avec les seuils d'activité des pollinisateurs, on obtient une fenêtre de butinage : ouverte, faible ou fermée. Les invasives, elles, sont repérées lors des observations de terrain et localisées précisément dans la parcelle.",
  },
  {
    titre: 'Ce que montre l\'animation',
    texte: "Choisissez une heure : la météo s'affiche, les insectes volent ou restent absents, et la cause de fermeture est indiquée. Le matin frais, seuls les bourdons sortent ; en milieu d'après-midi, un coup de vent suffit à tout arrêter. Chaque invasive est signalée avec le mode de gestion adapté.",
  },
  {
    titre: 'À quoi cela vous sert',
    texte: "Programmer fauches, broyages et arrachages quand les pollinisateurs ne sont pas au travail. Pour les cultures en fleurs, la réglementation impose d'ailleurs de réaliser les traitements en soirée, hors des heures de butinage. Agir sur les invasives au bon moment, avant qu'elles ne fleurissent ou ne se propagent. Et préserver des pollinisateurs dont dépendent une grande partie des fruits, des légumes et des semences.",
  },
  {
    titre: 'Pourquoi suivre les deux ensemble',
    texte: "Protéger les pollinisateurs, c'est à la fois respecter leurs heures de travail et leur garder une flore variée. Suivre la météo et les invasives sur la même parcelle permet de décider au bon moment, avec des données plutôt qu'à l'intuition.",
  },
];

/** Fiche explicative « La fenêtre de butinage ». Texte reproduit à l'identique, sans reformulation. */
export const PollinatorWindowFiche: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => (
  <DemoFiche
    open={open}
    onOpenChange={onOpenChange}
    kicker="Pollinisateurs et invasives"
    titre="La fenêtre de butinage"
    sousTitre="À quelles heures les pollinisateurs travaillent, et quelles plantes menacent l'équilibre de la parcelle."
    sections={SECTIONS}
    note="Les valeurs affichées dans l'animation sont des ordres de grandeur destinés à comprendre le phénomène, pas des mesures réelles."
  />
);
