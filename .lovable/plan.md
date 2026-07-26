## Objectif

Transformer le Widget 5 « Acidité » (aujourd'hui un simple curseur global pleine demi-largeur) en un bloc **pleine largeur**, aligné sur le pattern déjà éprouvé des Widgets 3 (Structure) et 4 (Texture) : consigne → protocole illustré + vidéos → saisie par prélèvement → synthèse.

## Ce que verra l'utilisateur

```text
┌──────────────────────────────────────────────────────────────┐
│ 5  ÉTAPE 2 · ACIDITÉ — « Le pH, clé de la nutrition »        │
│ [HERO SVG : profil de sol dont la teinte morphe selon le pH] │
│                                                              │
│ ① CE QUE VOUS DEVEZ FAIRE  (bandeau or)                      │
│   Mesurer le pH sur un échantillon humide de chacun de vos   │
│   prélèvements. Étapes : Humidifier → Mesurer → Lire → Noter │
│   Encart pédagogique : le pH pilote la disponibilité des     │
│   nutriments et explique pourquoi certaines plantes          │
│   prospèrent là où d'autres dépérissent.                     │
│   NB : la plupart des végétaux d'ornement aiment un pH proche │
│   de la neutralité ; certaines espèces recherchent des sols   │
│   très acides ou très calcaires.                             │
│                                                              │
│ ② LES TESTS (2 cartes protocole + étagère vidéo)             │
│   • Bandelette / kit colorimétrique  • pHmètre électronique   │
│   Schémas SVG animés + « Ciné-terrain » (1 à 3 vidéos)       │
│                                                              │
│ ③ RÉSULTATS PAR PRÉLÈVEMENT   (A → E, x/n complétés)         │
│   [A] test ▸ bandelette | pHmètre    pH ▸ [mini-curseur 4-9] │
│       + valeur colorée + classe (Très acide → Très basique)  │
│                                                              │
│ ④ SYNTHÈSE                                                   │
│   Barre de distribution par classe, pH moyen + amplitude,    │
│   lecture agronomique dominante, alerte « sol contrasté »    │
│   si l'écart entre prélèvements dépasse 1 point de pH.       │
└──────────────────────────────────────────────────────────────┘
```

## Détail des sections

**① Consigne** — bandeau or identique aux widgets 3/4, avec la chaîne d'étapes numérotées et les deux textes pédagogiques fournis (influence sur la disponibilité des nutriments + NB sur les végétaux d'ornement).

**② Protocoles nommés, schématisés, expliqués**
- *Bandelette / kit colorimétrique* : terre + eau déminéralisée, repos, trempage, lecture de la teinte sur nuancier.
- *pHmètre électronique* : calibration, boue de terre, insertion sonde, lecture stabilisée.
Chaque carte : titre, matériel, gestes numérotés, schéma SVG animé, piège à éviter.
Sous la première carte, une étagère vidéo « Ciné-terrain » repliable réutilisant les composants vidéo existants. **Les URLs seront fournies plus tard** : le registre de vidéos sera créé vide et un simple ajout de 1 à 3 entrées suffira ensuite pour les afficher (aucune autre modification de code nécessaire).

**③ Saisie par prélèvement** — une ligne par prélèvement positionné au bloc 2, reprenant strictement l'ergonomie de la ligne « Texture » : pastille lettre, choix du test, mini-curseur pH 4→9 (pas 0,1) avec valeur affichée dans la couleur de la classe, badge de classe animé, tooltip riche au survol décrivant chaque classe (sensoriel + agronomique + plantes typiques). Si aucun prélèvement n'existe, encart pointillé avec lien d'ancrage vers le bloc 2 (comme widget 4).

**④ Synthèse** — barres de distribution par classe de pH, pH moyen, min/max, classe dominante, lecture agronomique (disponibilité des nutriments, familles de plantes adaptées), signal « sol contrasté » quand l'amplitude est forte.

## Points techniques

- Nouveau modèle de données `phTests.ts` : classes de pH (bornes, couleur, label, lecture agronomique, plantes indicatrices), définition des 2 tests, registre vidéos, helpers `classifyPh`, `dominantPh` (moyenne, amplitude, distribution).
- Nouveaux composants dans `src/components/propriete/analyze/` : `PhCrossSection.tsx` (hero morphant), `PhPictos.tsx`, `PhProtocolCard.tsx`, `PhChoiceTooltip.tsx`, `PhSampleRow.tsx`, `PhResultsSummary.tsx`.
- `blocks/PhBlock.tsx` réécrit sur le modèle de `TextureBlock.tsx` ; garde la prop `value`/`onChange` du pH global, désormais **dérivé** de la moyenne des prélèvements (rétro-compatible avec les données déjà saisies).
- `usePropertySoil.ts` : ajout de `ph_test?: 'bandelette' | 'phmetre' | null` et `ph_value?: number | null` dans l'interface `SoilSample` (stockage dans le JSONB `samples` déjà persisté — **aucune migration SQL**).
- `TabAnalyze.tsx` : le widget 5 sort de la grille 2 colonnes pour passer en pleine largeur (bloc 6 « Signes de vie » reste tel quel, en dessous, pleine largeur) ; le compteur de blocs renseignés tient compte du pH par prélèvement.
- Aucun changement de logique métier hors de ces fichiers ; palette et tokens `--ds-*` existants réutilisés, avec la gamme colorée pH (rouge acide → bleu basique) déjà présente dans le fichier actuel.
