
## Objectif

Intégrer progressivement l’architecture complète des Marches du Vivant dans toute la plateforme :

```text
Architecture cible
├── 3 niveaux de maturité
│   ├── Efficace / pragmatique
│   ├── Innovant
│   └── Disruptif
├── 5 piliers
│   ├── L’Œil      : observer
│   ├── La Main    : expérimenter / mesurer
│   ├── Le Cœur    : ressentir / écrire / créer
│   ├── Le Palais  : goûter / relier terroir et paysage
│   └── L’Oreille  : écouter / bioacoustique / paysage sonore
├── 4 niveaux de marcheurs
│   ├── Marcheur
│   ├── Éclaireur
│   ├── Ambassadeur
│   └── Sentinelle
├── 3 types d’événements
│   ├── Agroécologique
│   ├── Éco-poétique
│   └── Éco-touristique
└── 3 temporalités
    ├── Avant
    ├── Pendant
    └── Après
```

L’idée n’est pas d’ajouter une “couche de contenus” isolée, mais de transformer les Marches du Vivant en système éditorial, pédagogique, communautaire et opérationnel complet.

---

## Phase 1 — Socle simple et rapide : rendre le cadre visible partout

### 1.1. Formaliser le référentiel commun

Créer un référentiel centralisé des Marches du Vivant dans le code :

- les 5 piliers ;
- les 4 niveaux de marcheurs ;
- les 3 types d’événements ;
- les 3 temporalités ;
- les familles d’activités : pratiques agroécologiques, espèces, textes, lieux remarquables, bioacoustique ;
- les missions adaptées à chaque niveau.

Ce référentiel servira autant à l’admin qu’à la web app marcheur.

### 1.2. Côté admin : ajouter une lecture “5 piliers” sur les événements

Sur `/admin/marche-events/:id`, ajouter un nouvel onglet :

```text
Parcours vivant
```

Il affichera pour chaque événement :

- le type de l’événement ;
- les points de marche associés ;
- les piliers déjà couverts ;
- les piliers manquants ;
- les missions disponibles par niveau de marcheur ;
- les suggestions avant / pendant / après ;
- un focus bioacoustique systématique.

Exemple pour Deviat :

```text
Haie / corridor
├── Œil      : lecture du paysage, haie, corridor
├── Main     : rôle agronomique, régulation
├── Oreille  : oiseaux de haie, bruissements, ambiance refuge
└── Cœur     : haïku après écoute
```

### 1.3. Côté web app marcheur : enrichir l’onglet “Apprendre”

L’onglet actuel `Apprendre & Créer` existe déjà et gère :

- le niveau du marcheur ;
- les angles biodiversité / bioacoustique / géopoétique ;
- les cartes pédagogiques.

Prochaine étape : l’étendre vers les 5 piliers.

Au lieu de seulement :

```text
Biodiversité / Bioacoustique / Géopoétique
```

on aura :

```text
Œil / Main / Cœur / Palais / Oreille
```

Chaque marcheur verra des contenus adaptés à son niveau.

### 1.4. Côté chatbot admin : stabiliser le “wahou”

Le chatbot admin contient déjà le cadre des 5 piliers et de la bioacoustique.

Prochaine étape : lui injecter davantage de données structurées depuis la base :

- piliers associés à l’événement ;
- points de marche ;
- activités prévues ;
- activités réalisées ;
- sons collectés ;
- textes écrits ;
- espèces reconnues ;
- recommandations par temporalité.

Résultat attendu : le chatbot ne répond plus seulement avec une synthèse narrative, mais avec une lecture stratégique complète.

---

## Phase 2 — Niveau innovant : créer les modules d’expérience

### 2.1. Créer une bibliothèque de modules d’expérience

Ajouter un modèle de données pour représenter les activités réutilisables.

Exemples de modules :

```text
Module : Pause d’écoute de 3 minutes
Pilier : L’Oreille
Types : agroécologique, éco-poétique, éco-touristique
Niveaux : marcheur, éclaireur
Temporalité : pendant
Objectif : écouter et qualifier le paysage sonore
```

```text
Module : Test bêche
Pilier : La Main
Types : agroécologique
Niveaux : éclaireur, ambassadeur, sentinelle
Temporalité : pendant
Objectif : rendre visible la vie du sol
```

```text
Module : Haïku après écoute
Pilier : Le Cœur + L’Oreille
Types : éco-poétique
Niveaux : tous
Temporalité : pendant / après
Objectif : transformer l’écoute en trace poétique
```

### 2.2. Associer les modules aux points de marche

Chaque point de marche devient une station d’expérience.

```text
Événement
└── Point de marche
    ├── Modules agroécologiques
    ├── Modules espèces
    ├── Modules écriture
    ├── Modules lieux remarquables
    └── Modules bioacoustiques
```

Côté admin, il faudra pouvoir :

- choisir les modules d’un point ;
- les ordonner ;
- définir leur niveau minimum ;
- préciser s’ils sont obligatoires ou optionnels ;
- ajouter des consignes terrain ;
- ajouter du matériel nécessaire ;
- prévoir une restitution après événement.

### 2.3. Côté marcheur : afficher des missions contextualisées

Dans la page exploration marcheur, pendant la consultation d’un point de marche, afficher :

```text
Vos missions sur ce point
```

Elles seront filtrées selon :

- le niveau du marcheur ;
- le type d’événement ;
- le point de marche ;
- le pilier actif ;
- la temporalité.

Exemple :

Pour un Marcheur :

```text
Fermez les yeux 2 minutes.
Notez 3 sons.
Choisissez celui qui raconte le mieux ce lieu.
```

Pour un Éclaireur :

```text
Enregistrez 45 secondes.
Indiquez l’habitat : haie, jachère, étang, parcelle.
Proposez une espèce probable ou une ambiance.
```

Pour une Sentinelle :

```text
Comparez cette ambiance sonore avec les observations espèces.
Le lieu confirme-t-il son rôle de corridor écologique ?
```

### 2.4. Ajouter un score d’équilibre des 5 piliers

Côté admin, calculer un indicateur simple :

```text
Équilibre du parcours
Œil      : 80 %
Main     : 70 %
Cœur     : 60 %
Palais   : 20 %
Oreille  : 40 %
```

L’objectif n’est pas de noter brutalement, mais d’aider à concevoir des événements plus complets.

Le système pourra proposer :

```text
Cet événement est très fort sur L’Œil et La Main.
Pour le rendre plus complet, ajoutez :
- une station d’écoute sur la haie ;
- une dégustation consciente ;
- une restitution sonore après événement.
```

---

## Phase 3 — Niveau disruptif : le jumeau vivant des marches

### 3.1. Créer une “Partition vivante” de chaque événement

Chaque événement devient une partition composée de :

- points de marche ;
- piliers ;
- sons ;
- photos ;
- textes ;
- espèces ;
- pratiques agricoles ;
- lieux patrimoniaux ;
- ressentis.

Restitution possible :

```text
Partition vivante de Deviat
1. La haie respire
2. Les ruches vibrent
3. La jachère murmure
4. Le sol se révèle
5. Le relais postal transmet la mémoire du lieu
```

### 3.2. Créer un indice de Résonance du Vivant

Pour chaque point ou événement, calculer un indicateur composite :

```text
Résonance du Vivant
= diversité des observations
+ richesse sonore
+ qualité des pratiques agroécologiques
+ intensité poétique
+ implication des marcheurs
+ valeur patrimoniale / terroir
```

Cet indice devra rester pédagogique, non technocratique.

Exemple :

```text
Haie de Deviat — Résonance forte
Pourquoi :
- corridor écologique lisible
- oiseaux de haie probables
- ruches proches
- support d’écriture poétique
- valeur agricole et sensible
```

### 3.3. Construire une carte vivante territoriale

À terme, chaque contribution nourrit une carte globale :

```text
Carte vivante
├── Observations espèces
├── Sons originaux
├── Haïkus et textes
├── Pratiques agroécologiques
├── Lieux remarquables
└── Indices de résonance
```

La carte permettra de comparer :

- événement par événement ;
- territoire par territoire ;
- saison par saison ;
- type de milieu par type de milieu ;
- niveau de marcheur par niveau de marcheur.

### 3.4. IA compagnon différenciée selon les rôles

Déployer une IA compagnon côté marcheur, différente du chatbot admin.

Elle pourra guider :

#### Marcheur

- écouter ;
- observer ;
- ressentir ;
- déposer une première contribution.

#### Éclaireur

- documenter ;
- géolocaliser ;
- qualifier ;
- comparer.

#### Ambassadeur

- animer ;
- transmettre ;
- raconter ;
- valoriser.

#### Sentinelle

- valider ;
- consolider ;
- produire une preuve ;
- préparer des restitutions partenaires.

---

## Ordre de réalisation recommandé

### Étape A — Court terme : 1 à 2 semaines

Priorité : rendre l’architecture visible sans tout reconstruire.

À faire :

1. Créer le référentiel central des 5 piliers / niveaux / temporalités.
2. Étendre l’onglet `Apprendre` côté marcheur aux 5 piliers.
3. Ajouter une première carte “Parcours vivant” côté admin événement.
4. Enrichir les contenus `insight_cards` existants avec les 5 piliers.
5. Ajouter des suggestions automatiques simples pour les piliers manquants.
6. Mettre à jour le chatbot admin pour exploiter ces éléments dans ses réponses.

Résultat : la logique 5 piliers devient visible immédiatement.

---

### Étape B — Moyen terme : 3 à 6 semaines

Priorité : passer d’un cadre éditorial à un vrai système opérationnel.

À faire :

1. Créer les tables des modules d’expérience.
2. Créer les associations module ↔ point de marche ↔ événement.
3. Ajouter l’interface admin de composition de parcours.
4. Ajouter les missions marcheur par niveau dans la web app.
5. Relier les contributions existantes :
   - photos ;
   - sons ;
   - textes ;
   - kigo ;
   - observations ;
   - quiz ;
   - Fréquences.
6. Créer le score d’équilibre des 5 piliers.
7. Ajouter des exports enrichis pour OSFARM / FNSEA / partenaires.

Résultat : chaque événement devient programmable, animable et restituable.

---

### Étape C — Long terme : 2 à 4 mois

Priorité : créer la signature différenciante des Marches du Vivant.

À faire :

1. Générer une partition vivante après chaque événement.
2. Créer l’indice de Résonance du Vivant.
3. Construire la carte sonore et sensible des territoires.
4. Ajouter l’IA compagnon côté marcheur.
5. Créer des albums sonores ou récits multimédias post-événement.
6. Comparer les événements dans le temps.
7. Produire des tableaux de bord d’impact territorial.

Résultat : la plateforme devient un outil unique de preuve sensible, scientifique, poétique et territoriale.

---

## Priorité fonctionnelle côté admin

Côté admin, les prochaines fonctionnalités doivent être :

1. **Onglet Parcours vivant** sur chaque événement.
2. **Gestion des modules d’expérience**.
3. **Association des modules aux points de marche**.
4. **Vue équilibre des 5 piliers**.
5. **Préparation avant / animation pendant / restitution après**.
6. **Synthèse IA enrichie** pour chaque événement.
7. **Export partenaire** intégrant les 5 piliers et la bioacoustique.

---

## Priorité fonctionnelle côté web app marcheur

Côté marcheur, les prochaines fonctionnalités doivent être :

1. **Missions personnalisées selon le niveau**.
2. **Navigation par point de marche** enrichie par les 5 piliers.
3. **Onglet Apprendre restructuré autour des piliers**.
4. **Contribution guidée** :
   - photo ;
   - son ;
   - texte ;
   - kigo ;
   - observation ;
   - ressenti.
5. **Récompenses en Fréquences** liées aux missions.
6. **Progression vers Éclaireur / Ambassadeur / Sentinelle** plus explicite.
7. **Carnet vivant enrichi** avec traces sonores, poétiques et agroécologiques.

---

## Modèle de données cible

À terme, prévoir une extension Supabase autour de ces objets :

```text
experience_modules
├── titre
├── description
├── pilier
├── type_evenement
├── niveau_minimum
├── temporalite
├── consigne
├── materiel
├── duree_estimee
├── mode_numerique
└── actif

event_point_modules
├── marche_event_id
├── marche_id
├── module_id
├── ordre
├── obligatoire
└── consigne_contextuelle

walker_missions
├── user_id
├── marche_event_id
├── marche_id
├── module_id
├── statut
├── contribution_type
├── contribution_id
└── frequences_attribuees

event_living_summaries
├── marche_event_id
├── score_oeil
├── score_main
├── score_coeur
├── score_palais
├── score_oreille
├── indice_resonance
├── synthese_json
└── synthese_markdown
```

---

## Stratégie de mise en œuvre recommandée

Je recommande une approche progressive en trois livrables.

### Livrable 1 — “Cadre visible”

Sans gros changement de base de données.

- référentiel 5 piliers ;
- UI admin simple ;
- UI marcheur enrichie ;
- contenu pédagogique ;
- chatbot plus cohérent.

### Livrable 2 — “Parcours composable”

Avec nouvelles tables.

- modules d’expérience ;
- association aux points de marche ;
- missions par niveau ;
- score d’équilibre ;
- premières restitutions structurées.

### Livrable 3 — “Jumeau vivant”

Avec intelligence de synthèse.

- partition vivante ;
- indice de résonance ;
- carte sensible ;
- albums sonores ;
- IA compagnon marcheur ;
- exports institutionnels.

---

## Recommandation finale

La prochaine étape la plus pertinente est de commencer par le **Livrable 1 — Cadre visible**.

Il donne rapidement une cohérence forte à toute l’expérience sans attendre une refonte lourde :

```text
Admin
→ comprendre, préparer, équilibrer, restituer

Marcheur
→ apprendre, contribuer, progresser

Chatbot
→ synthétiser, recommander, valoriser

Événement
→ devenir un parcours vivant structuré par les 5 piliers
```

Ensuite seulement, on passe au système complet de modules et missions.
