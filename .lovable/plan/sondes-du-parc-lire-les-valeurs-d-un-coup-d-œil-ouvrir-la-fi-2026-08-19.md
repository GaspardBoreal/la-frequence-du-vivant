# « Sondes du parc » : lire les valeurs d'un coup d'œil, ouvrir la fiche au clic

## 1. Deux valeurs clés par sonde, comparables entre elles

Chaque ligne affiche deux mesures choisies selon la famille de la sonde :

- Sonde de sol : **humidité du sol** (profondeur la moins profonde) + **température du sol** de la même profondeur ; si la sonde remonte aussi l'air, l'air passe en second choix.
- Station météo : **température de l'air** + **humidité de l'air**.
- Repli si une grandeur manque : la première grandeur disponible, jamais de case vide muette (« non transmise » en gris atténué).

### Le rendu qui fait comprendre les écarts

Deux « colonnes de comparaison » alignées verticalement sur toute la liste — une pour l'humidité, une pour la température — pour que l'œil balaye la colonne et voie immédiatement qui est haut, qui est bas.

Dans chaque cellule :

- la valeur en gros chiffres tabulaires (alignement parfait des unités) ;
- une **barre de position** dessinée sur l'échelle commune du parc pour cette grandeur (min → max mesurés sur toutes les sondes), avec un curseur à la valeur de la sonde ;
- des repères discrets min / médiane / max partagés par toutes les lignes, donc les curseurs se lisent comme un petit graphique en colonne ;
- une teinte de valeur sobre : bleu profond = humide/froid, ambre = sec/chaud, via des tokens du design system (pas de couleurs en dur) ;
- si une sonde est l'extrême du parc, une micro-étiquette « le plus sec » / « le plus chaud », discrète.

Sous la liste, une ligne d'échelle du type `Humidité du sol : 18 % → 41 % sur le parc · Température : 14,2 °C → 25,5 °C`, plus la légende d'états existante conservée.

Sondes hors service (maintenance / retirée) : valeurs en gris, exclues du calcul min/max du parc pour ne pas fausser l'échelle.

### Mobile first : la liste est pensée d'abord pour le téléphone

Le format de référence est l'écran de téléphone tenu à une main ; le bureau n'est qu'un élargissement de cette carte.

Sur mobile, chaque sonde devient une **carte empilée en trois étages**, sans aucun défilement horizontal :

```text
┌──────────────────────────────────────┐
│ ● En ligne        Sonde Potager d'Été│
│ b26s002 · Jardin Monde DEVIAT        │
├──────────────────────────────────────┤
│ Humidité sol 15 cm     Temp. sol     │
│      39 %                25,5 °C     │
│  ▓▓▓▓▓▓░░░░░ ▲          ░░▓▓▓▓▓▓ ▲   │
│  le plus humide                      │
├──────────────────────────────────────┤
│ vue il y a 13 min · Batterie 83 %    │
└──────────────────────────────────────┘
```

Règles mobiles :

- **Deux valeurs côte à côte** (grille 2 colonnes), jamais empilées : c'est la comparaison qui porte le sens.
- Chiffre en `text-2xl` tabulaire pour rester lisible à bout de bras ; unité en petit à côté, jamais rognée.
- Les barres de position gardent la **même échelle de parc** que sur bureau, donc en faisant défiler la liste au pouce, les curseurs dessinent naturellement la comparaison entre sondes.
- Zone tactile pleine carte, hauteur minimale 56 px, retour visuel à l'appui (`active:`), et pas de lien imbriqué qui volerait le clic.
- Métadonnées secondaires (série, fraîcheur, batterie) en pied de carte, en petit et atténué — jamais entre les deux valeurs.
- Aucun texte tronqué : le nom de la sonde peut passer sur deux lignes plutôt que se couper.
- La ligne d'échelle du parc et la légende d'états restent affichées, repliées en deux lignes compactes.

À partir de `sm`, les trois étages se recomposent en une ligne unique : identité à gauche, colonnes de comparaison alignées au centre, fraîcheur et batterie à droite.

La popup fiche capteur suit la même logique : plein écran en bas d'écran sur mobile (feuille glissante, poignée de fermeture, défilement interne), dialogue centré à partir de `sm`.


## 2. Clic sur une ligne = fiche capteur en popup

La ligne entière devient cliquable (bouton accessible, focus visible, `Entrée`/`Espace`).

Le contenu de la fiche déjà visible sur l'onglet Carte (photo en situation, état de service, propriété, emplacement, coordonnées, batterie, réception, dernières mesures, vitalité 48 h, « Voir tous les graphes », « Interroger l'IA de Jardin ») est **extrait tel quel** dans un composant partagé, puis affiché :

- sur l'onglet Carte : comme aujourd'hui, dans le panneau latéral (aucun changement visuel) ;
- sur l'accueil : dans une popup centrée, scrollable, fermable au clic extérieur et à `Échap`.

Les actions d'écriture (changer l'état de service) restent soumises aux mêmes droits qu'aujourd'hui ; un partenaire sans droit voit la fiche en lecture.

## Détails techniques

- Nouveau `src/components/iot/SensorCardBody.tsx` : extraction du bloc `selected` de `SensorsMapTab.tsx` (props : `capteur`, `latest`, `pings`, `covers`, `capabilities`, `onObservatory`, `onAskAi`). `SensorsMapTab` l'utilise à la place de son JSX inline — même rendu, zéro régression.
- Nouveau `src/components/iot/SensorPeekDialog.tsx` : `Dialog` shadcn enveloppant `SensorCardBody`, utilisé par `IotPartnerHome`.
- Nouveau `src/lib/iot/keyReadings.ts` : choix des deux grandeurs par famille de capteur, calcul des échelles min/max/médiane du parc, et libellés d'extrêmes. Utilise `grandeurMeta` / `fmtMesure` existants et respecte la liste des grandeurs masquées (`soil_capacitance` reste exclue).
- `IotPartnerHome.tsx` : `useLatestMesures(ids)` pour les dernières mesures, rendu des lignes cliquables + colonnes de comparaison + ligne d'échelle. Le `SensorObservatory` s'ouvre depuis la popup.
- Aucun changement de base de données, de webhook ni de logique de collecte.
