# Ancrer l'exercice « Entraîner le modèle qui reconnaît les espèces » dans le réel iNaturalist

L'API d'iNaturalist ne renvoie **aucune** donnée d'énergie ni de CO2 : ni la
documentation développeurs, ni les pratiques recommandées, ni les conditions
d'usage n'exposent la moindre mesure de consommation. Comparer « résultat
simulé » et « résultat renvoyé par l'API » est donc impossible en l'état, et le
dire clairement fait partie de la leçon.

Ce qui est comparable, en revanche, est publié et vérifiable :

- iNaturalist publie le matériel et la taille de ses entraînements : trois
  cartes NVIDIA RTX 8000, 25 millions de photos, 47 000 taxons, « quelques mois »
  d'entraînement puis quelques semaines de validation.
- Le modèle courant est décrit à chaque sortie : v2.23, 106 407 taxons,
  réentraîné tous les un à deux mois.
- L'API publique donne en direct les volumes réels : nombre d'observations et
  d'espèces, mondialement ou sur un territoire donné.

L'exercice passe donc d'une simulation entièrement réglée à la main à une
simulation **calée sur des grandeurs réelles**, avec l'écart assumé.

## Ce que le visiteur verra

Sous les curseurs existants, un nouveau bloc **« Et dans la vraie vie ? »** en
trois temps.

### 1. Le bouton « Prendre les réglages réels d'iNaturalist »

Un clic remplit les curseurs avec le matériel publié : trois RTX 8000
(260 W chacune, puissance annoncée par le constructeur), processeur et mémoire
du serveur d'entraînement, durée par défaut de trois mois. Le pays reste au
choix du visiteur, avec une mention explicite : iNaturalist ne publie ni le
pays d'hébergement ni l'efficacité de son centre de données, donc ces deux
réglages restent des hypothèses — jamais présentées comme mesurées.

### 2. Les volumes réels, côte à côte

Deux compteurs animés : **vos marches** (observations et espèces réellement
collectées, depuis vos propres données publiques) face au **monde entier**
(total iNaturalist, récupéré en direct). Le rapport d'échelle s'affiche en une
phrase (« il faudrait X saisons de marches pour nourrir un entraînement »), et
le résultat du simulateur est ramené à un **coût par photo apprise** : la
grandeur qui rend le chiffre transportable d'un cas à l'autre.

Les valeurs sont récupérées en direct à l'ouverture ; si l'API ne répond pas,
les valeurs relevées et datées s'affichent à la place, avec leur date de relevé
et le lien vers la source.

### 3. Second volet : entraîner une fois, identifier un million de fois

Un mini-exercice ajouté à la même carte : un curseur « nombre de photos
identifiées par mois » et une barre qui montre le basculement — au bout de
combien d'identifications le service d'identification dépasse le coût de
l'entraînement unique. C'est le point pédagogique le plus fort : l'empreinte
d'un modèle ne se joue presque jamais à l'entraînement.

Comme pour le reste de la page, le volet « Comment ce résultat est calculé »
liste la formule, les constantes avec leur source datée, et sépare ce qui est
mesuré de ce qui est supposé.

## Ce qui reste hors périmètre

Aucune identification réelle n'est envoyée à iNaturalist : leur point d'entrée
de reconnaissance d'image demande un compte authentifié, et l'appeler en masse
depuis une page publique irait contre leurs règles d'usage. Le volet
identification reste un calcul, pas un appel.

## Détail technique

- `src/content/iaFrugale/inaturalistReel.ts` : constantes publiées (matériel,
  photos, taxons, version du modèle, cadence de réentraînement) avec pour
  chacune `source` + `consulteLe`, plus les valeurs de repli datées pour les
  compteurs en direct.
- `src/hooks/iaFrugale/useInatVolumes.ts` : React Query, un appel
  `https://api.inaturalist.org/v1/observations?per_page=0` (+ variante espèces)
  pour le total mondial, `staleTime` 24 h, `retry` 1 ; réutilise la source
  interne existante des statistiques publiques pour le volet « vos marches ».
  En cas d'échec, renvoie les valeurs de repli avec un drapeau `fallback`.
- `src/components/ia-frugale/AncrageInaturalist.tsx` : le bloc en trois temps,
  bouton de préréglage (met à jour l'état des curseurs du `SimulateurCard`),
  compteurs côte à côte, barre de bascule entraînement / identification,
  `SourceNote` en pied.
- `SimulateurCard.tsx` : accepte un enfant optionnel rendu après les résultats
  et expose un `setValeurs` pour que le préréglage puisse pousser des valeurs.
- `casUsage.ts` : le simulateur `codecarbon-mdv` déclare l'ancrage ; les lignes
  « hypothèses » sont mises à jour (pays et PUE non publiés par iNaturalist).
- Tokens sémantiques existants, aucune couleur en dur, mobile d'abord.

## Vérification

Page ouverte à 375 px et 1280 px, thèmes clair et sombre ; contrôle que le
préréglage déplace bien les curseurs, que le repli s'affiche quand l'appel
échoue, et que chaque chiffre est rattaché à sa source datée.
