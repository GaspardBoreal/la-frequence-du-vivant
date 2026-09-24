import React from 'react';
import { DemoFiche, DemoFicheSection } from './DemoFiche';

const SECTIONS: DemoFicheSection[] = [
  {
    titre: 'Ce qui se passe sous la pluie',
    texte: "Sur un sol laissé nu, les gouttes frappent directement la terre et cassent les petits agrégats. En quelques minutes, une fine croûte se forme en surface, comme un couvercle : c'est la croûte de battance. L'eau ne rentre plus, elle ruisselle vers le bas de la parcelle en emportant de la terre fertile. Sous un couvert permanent, les plantes et les résidus amortissent la pluie. En dessous, les racines et les galeries des vers de terre forment un réseau de chemins qui guident l'eau en profondeur. Le sol se comporte alors comme une éponge.",
  },
  {
    titre: 'Comment on le sait',
    texte: "Des sondes BRAD, plantées dans le sol, mesurent en continu la quantité d'eau présente à 15, 30 et 60 cm de profondeur. Elle s'exprime en pourcentage du volume de terre : 20 % d'humidité sur une couche de 10 cm, c'est l'équivalent de 20 mm de pluie stockés. En suivant les trois profondeurs au fil d'un orage, on voit l'eau descendre, étage par étage. Si la sonde la plus profonde ne bouge pas, c'est que l'eau n'est jamais arrivée jusqu'à elle.",
  },
  {
    titre: 'Ce que montre l\'animation',
    texte: "Les deux sols reçoivent exactement le même orage de 50 mm et partent du même état. Sur sol nu, l'eau s'arrête dans les premiers centimètres et plus de la moitié ruisselle. Sous couvert, presque toute l'eau s'infiltre jusqu'à 60 cm. Trois jours plus tard, la surface nue a séché au soleil, tandis que le couvert a limité l'évaporation : l'eau reste disponible pour la culture.",
  },
  {
    titre: 'À quoi cela vous sert',
    texte: "Mesurer la réserve d'eau réellement disponible avant une période sèche. Décider du bon moment pour semer, intervenir ou irriguer, et éviter d'arroser un sol qui a déjà de l'eau en profondeur. Vérifier, chiffres à l'appui, que vos couverts et la réduction du travail du sol améliorent l'infiltration et limitent l'érosion d'une année sur l'autre.",
  },
  {
    titre: 'Pourquoi l\'agriculture de conservation',
    texte: "Elle repose sur trois principes : couvrir le sol en permanence, le travailler le moins possible et diversifier les cultures. Les effets sur la structure du sol se construisent en quelques saisons ; les sondes permettent de les suivre au fil du temps.",
  },
];

/** Fiche explicative « Le sol éponge ». Texte reproduit à l'identique, sans reformulation. */
export const SoilSpongeFiche: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => (
  <DemoFiche
    open={open}
    onOpenChange={onOpenChange}
    kicker="Agriculture de conservation"
    titre="Le sol éponge"
    sousTitre="Pourquoi un sol couvert garde l'eau de pluie, et comment on le mesure."
    sections={SECTIONS}
    note="Les valeurs affichées dans l'animation sont des ordres de grandeur destinés à comprendre le phénomène, pas des mesures réelles."
  />
);
