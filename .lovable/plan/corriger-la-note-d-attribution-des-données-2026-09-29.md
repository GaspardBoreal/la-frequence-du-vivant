# Corriger la note d’attribution des données

## Diagnostic confirmé

La colonne actuelle « G. Boréal + MdV » ne mesure pas un droit de propriété personnel. Elle additionne des réalités différentes : contributions signées par Gaspard Boréal, créations d’autres marcheurs réalisées dans les Marches du Vivant, activité du compte associatif, données factuelles, données tierces ouvertes et contenus dont l’auteur n’est pas enregistré.

Deux anomalies particulièrement importantes sont confirmées :

- les 241 photos de marches et 51 audios de marches sont aujourd’hui comptés comme attribués à MdV alors que ces tables ne contiennent aucune information d’auteur ;
- les 403 snapshots sont comptés comme attribués alors que 371 contiennent au moins une attribution tierce iNaturalist.

Le texte joint doit aussi être recalculé avant reprise : les œuvres actuellement dénombrables représentent **788 contenus**, et non 778 (477 médias marcheurs + 9 textes + 10 audios marcheurs + 241 photos de marches + 51 audios de marches).

## Correctif proposé

### 1. Remplacer le ratio ambigu

Supprimer de la note le grand indicateur « G. Boréal + MdV / total » et toute formulation pouvant être lue comme une preuve de propriété personnelle.

Présenter à la place trois indicateurs indépendants :

1. **Œuvres avec auteur identifié** : contenus créatifs reliés à un auteur enregistré ;
2. **Œuvres sans auteur enregistré** : les 241 photos et 51 audios de marches, à régulariser ;
3. **Base et données d’activité** : volume structuré par la plateforme, sans assimilation à un droit d’auteur personnel.

Aucun pourcentage global ne mélangera ces catégories.

### 2. Reclasser chaque famille selon sa nature juridique

Créer une synthèse lisible avec les catégories suivantes :

- **Œuvres** : médias, photos, audios et textes, ventilés entre Gaspard Boréal, compte associatif, autres marcheurs et auteur non enregistré ;
- **Observations factuelles** : ventilées par compte contributeur, sans les présenter comme des œuvres possédées ;
- **Données d’activité associative** : marches, événements, points d’étape et participations ;
- **Données tierces sous licence** : snapshots et attributions iNaturalist/GBIF/INPN, exclus de toute revendication de propriété ;
- **Données personnelles ou de tiers** : propriétés et profils, explicitement hors actif appropriable ;
- **Mesures IoT** : uniquement dans la version Complète, classées comme mesures techniques et non comme œuvres.

### 3. Rendre les calculs probants

Faire évoluer le calcul sécurisé afin qu’il retourne, pour chaque catégorie : total, Gaspard auteur identifié, compte association, autres contributeurs, auteur non enregistré et données tierces.

Règles principales :

- une signature de compte prouve une attribution technique, pas à elle seule la titularité juridique ;
- une photo ou un audio sans champ d’auteur reste « auteur non enregistré » ;
- les snapshots ne sont jamais comptés comme œuvre de Gaspard ou de l’association ;
- le droit du producteur de base est présenté séparément et qualitativement, sans le déduire d’un ratio de lignes.

### 4. Adapter l’écran et les deux PDF

Aligner strictement l’affichage et l’impression :

- **Simple** : en-tête daté, synthèse par nature, répartition des œuvres et principaux contributeurs ; IoT exclu ;
- **Complète** : contenu Simple, détail de toutes les familles, sources tierces, données d’activité, qualification juridique et formulation statutaire ; IoT inclus ;
- conserver l’état déplié ou réduit des principaux contributeurs dans le PDF ;
- ajouter sous les chiffres la mention : « Attribution issue des comptes et métadonnées enregistrés ; elle ne vaut pas preuve définitive de titularité. »

### 5. Corriger la réponse juridique

Reformuler la conclusion autour de deux fondements distincts :

- **qualité d’auteur** : uniquement pour les œuvres dont l’auteur est démontrable ;
- **qualité de producteur de base** : à étayer par les investissements substantiels de constitution, vérification et présentation de la base.

La note signalera les 292 contenus sans auteur enregistré comme un **chantier d’attribution prioritaire**, sans présumer qu’ils appartiennent à Gaspard Boréal ou à l’association. Elle conservera l’avertissement indiquant que le document ne constitue pas un avis juridique.

## Vérification

- rapprocher chaque sous-total des lignes réelles de la base ;
- vérifier que les catégories sont mutuellement exclusives et que leurs sommes retombent exactement sur les totaux ;
- tester les versions Simple et Complète à l’écran et en PDF ;
- confirmer qu’aucun chiffre ne présente l’activité collective des Marches du Vivant comme une propriété personnelle.
