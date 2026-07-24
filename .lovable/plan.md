
# Partenariat stratégique Ver de Terre / Alliance Paysage → App "Propriété Jardin"

## Synergies identifiées

**Programme APRN** (5 modules e-learning) forme des paysagistes à l'agroécologie et livre un OAD (Outil d'Aide à la Décision). **Outil Diagnostic Site (D.S.)** = méthode terrain 5 étapes (Observer → Sol → Flore bio-indicatrice → Synthétiser → Palette).

**Ce que La Fréquence apporte** :
- Catalogue vivant d'espèces observées (auto-alimente étapes 1 et 3)
- Cadastre + stations météo + carte satellite (auto-alimente étape 1)
- Réseau de marcheurs = capteur récurrent pour mesurer l'évolution (boucle "Marche du Vivant" suggérée avec finesse à chaque diagnostic)
- OAD numérique responsive = livrable concret de la formation APRN

**Ce que APRN apporte** :
- Méthode structurée (D.S.) validée pédagogiquement
- Bibliothèque bio-indicatrices (herbacées, arbustes, arbres)
- Réseau national de paysagistes formés = futurs clients "Prestataire"

## Décisions actées (Q&R)

- **MVP** : Fondations CRM + entité Propriété + app Propriétaire responsive PC/Tablette/Smartphone. App Prestataire = Phase 2.
- **Diagnostic D.S.** : co-édition Propriétaire + Prestataire, rôle défini par propriété, historique multi-auteurs.
- **Palette végétale (étape 5)** : bibliothèque intégrée basique (~150 espèces avec tags sol/exposition/eau/bio-indication) — étiquetée « en cours de développement » mais fonctionnelle.
- **Login multi-app** : propriété principale par défaut + switcher permanent dans le header.

## Livraison en 5 phases

### Phase 0 — Maquettes (immédiat, avant tout code)
Produire **3 directions design** de la fiche Propriété principale (écran pivot vu 90% du temps) via `design--create_directions`, testées sur les 3 devices. Choix utilisateur avant d'entamer la Phase 1.

Les 3 directions proposées :
1. **"Carnet de terrain vivant"** — inspiration PDF D.S. : ambiance kraft/papier, pictogrammes botaniques, progression 20%/40%/60%, tons sépia et vert olive. Rassurant pour paysagistes traditionnels.
2. **"Cockpit écosystème"** — dashboard bento moderne, cartes en verre, timeline biodiversité live, KPI météo/sol/espèces en temps réel, tons Forêt Émeraude cohérents avec l'app actuelle. Efficace pour propriétaires tech-savvy.
3. **"Journal poétique du lieu"** — plein écran narratif avec grande photo de la propriété, saisons qui défilent, diagnostic présenté comme récit chapitré, ambiance Papier Crème actuelle. Émotionnel, aligné avec la marque Fréquence du Vivant.

### Phase 1 — Fondations CRM + entité Propriété (backend)
- Colonne `famille_client` sur `crm_companies` : `PROPRIETAIRE_LIEUX` | `PAYSAGISTE` | `AUTRE`
- Nouvelle table `proprietes` : nom, adresse, GPS, surface, photo hero, description, `owner_company_id` (1-1), `main_walker_id`
- Table de liaison `propriete_acces` : propriété ↔ companies (M-N) avec rôle (`gestionnaire` / `prestataire` / `lecture`)
- Table de liaison `propriete_marcheurs` : propriété ↔ community_profiles (M-N) + flag `is_main` (une seule propriété principale par marcheur)
- Table `propriete_marche_events` : propriété ↔ marche_events (1-N)
- Colonne `role_propriete` sur `community_profiles` : `marcheur_historique` | `proprietaire` | `prestataire` (calculée via trigger sur les liaisons)
- RPC `get_propriete_biodiversity(propriete_id)` : agrège toutes les espèces observées lors de tous les events rattachés
- RLS strictes : un marcheur ne voit que les propriétés auxquelles il a accès

### Phase 2 — Admin : "Organisateurs et Propriétés"
Renommer le bloc admin actuel et créer **deux sous-menus** :
- **Organisateurs** (existant, inchangé)
- **Propriétés** (nouveau) : liste + KPI (nb propriétés, nb events, biodiversité cumulée) + filtres (nom, ville, famille client, prestataire) + fiche + CRUD complet
- Sur fiche marcheur admin : badge visuel du `role_propriete` (marcheur historique / propriétaire / prestataire) + tableau des propriétés liées

### Phase 3 — Écran /connexion enrichi
- Après login, RPC `get_user_apps_access()` retourne : `hasMarcheurAccess`, `proprietesAccessibles[]`, `proprietePrincipaleId`
- Si `proprietesAccessibles.length > 0` :
  - Redirection automatique vers `/propriete/:mainId` (l'app Propriété sur la propriété principale)
  - Switcher permanent dans le header : "App Marcheur ⇄ Mes Propriétés" + sélecteur si plusieurs propriétés
- Sinon : redirection vers `/marches-du-vivant/mon-espace` (comportement actuel)
- Mémorisation du dernier choix dans localStorage pour respect fluidité

### Phase 4 — App Propriété responsive (Propriétaire)
Nouvelle route `/propriete/:id` avec 5 onglets alignés sur l'Outil D.S. :

| Étape | Onglet | PC | Tablette | Smartphone |
|-------|--------|----|---------:|-----------|
| 1 | **J'observe le site** | Formulaire complet contexte/relief/soleil/vent/eau/végétation + carte cadastre + stations météo proches + analyse sensorielle riche | Saisie tactile checkbox par pictogrammes, photo terrain intégrée | Saisie terrain 1 question par écran, capture photo GPS |
| 2 | **J'analyse le sol** | Tests bocal/boudin/bêche avec vidéos tuto + saisie prélèvements multi-zones + test CO² | Wizard visuel avec animations, upload photo test | Capture photo test + slider tactile texture |
| 3 | **J'identifie la flore** | Liste enrichie bio-indicatrices croisée avec **espèces observées lors des marches du vivant** de cette propriété + comparaison auto avec étape 2 | Cartes empilables avec swipe + Pl@ntNet intégré | Scan photo → suggestion espèce (Pl@ntNet) |
| 4 | **Je synthétise** | Portrait écologique complet + génération **PDF détaillé A4** avec tous inputs, photos, cartes | Synthèse visuelle + **PDF intermédiaire** design | Résumé 1 page + **PDF simple** partageable |
| 5 | **Palette végétale** | Base de ~150 végétaux filtrés (sol/exposition/eau) + tags "en cours de développement" sur suggestions IA | Cartes végétaux swipeables | Top 10 essences adaptées |

**Nudge "Marche du Vivant"** : bandeau discret et contextualisé (apparaît uniquement si la propriété n'a pas eu de marche depuis >12 mois OU aucune marche organisée) — « Suivez l'évolution de votre biodiversité : organisez une Marche du Vivant sur votre propriété ».

### Phase 5 — Factorisation composants Carte/Marcheurs/Biodiversité
Extraire vers `src/features/shared/` les modules réutilisés par les deux apps :
- `<PropertyBiodiversityMap />` (basé sur `RichMap`)
- `<SpeciesCollectionExplorer />`
- `<CadastreLayer />`, `<WeatherStationsNearby />`
- Hooks : `usePropertyBiodiversity`, `usePropertyCadastre`, `usePropertyWeatherStations`
Chaque module accepte un `scope` : `{ type: 'marche_event' | 'propriete', id: string }`.

**App Prestataire** : marquée **"En cours de développement"** partout (menu, dashboard, fiches). Phase séparée après validation Propriétaire.

## Détails techniques

**Base "palette végétale basique"** :
- Table `vegetal_catalog` : nom_latin, nom_fr, strate, exposition[], sol_ph_min/max, sol_humidite[], bio_indicateur_de[], rusticite, hauteur, floraison, comestible, mellifere
- Seed initial : ~150 espèces extraites du PDF D.S. (bio-indicatrices) + croisement avec top espèces observées dans nos marches
- Éditeur admin `/admin/outils/palette-vegetaux` pour enrichir

**Génération PDF** : `@react-pdf/renderer` déjà présent, templates différenciés PC (multi-pages + carte + tableaux) / Tablette (visuel A4 1 page) / Smartphone (résumé A5).

**Responsive strategy** :
- `useDeviceContext()` hook : `desktop | tablet | mobile` basé sur breakpoints + touch detection
- Layouts distincts par device (pas juste responsive CSS) pour les onglets Diagnostic
- Composant `<PropertyShell />` gère le layout global (sidebar PC, drawer tablette, bottom tabs mobile)

**Switcher app** : composant `<AppSwitcher />` dans header, sauvegarde `lastAppUsed` en localStorage, RPC unique pour accès autorisés.

## Livrable Phase 0 (prochaine action)

Générer les 3 directions design via `design--create_directions` sur la fiche Propriété principale (vue "cockpit"), puis présenter le choix via `ask_questions type=prototype`. Aucun code écrit avant validation.
