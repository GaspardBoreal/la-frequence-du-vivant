# Intégration des 8 modèles « Jardin nourricier »

Import complet (données + 16 images) dans la Supabase partagée, écran de sélection dans `/jardin/demarrer`, et édition complète dans Admin → Onboarding. L'app « Onboarding Fréquence Jardin » (projet séparé) consommera la même base.

## 1. Audit du ZIP — résultat (déjà vérifié)

- 18 fichiers : `README.md`, `exemples-jardin-nourricier.json` (valide), 8 grands WebP **1536 × 1024 px**, 8 vignettes WebP **360 × 240 px**.
- 8 exemples, identifiants stables uniques (`potager_familial_genereux` … `potager_facile_accessible`), ordres 1→8, tous les champs renseignés (titre, sous-titre, alt, intention, 12 mots-clés, `ai_profile`).
- 1 `generation_logic` commun (contrôles obligatoires, pondération 60/25/15, règle de sécurité) et 1 `image_spec` commun.
- Tous les chemins `large_image` / `thumbnail_image` pointent vers des fichiers réellement présents. WebP : compatible Storage et navigateurs.

## 2. Audit Supabase — résultat (vérifié sur la base réelle)

- `onboarding_garden_types` : 7 types déjà présents, dont **`nourricier`** (le `jardin_nourricier` du JSON — même jardin, identifiant différent). **0 exemple** dans la base : aucun risque d'écrasement.
- `onboarding_garden_examples` : vide, colonnes simples (titre, sous_titre, description, image_url, source_url, position, publie).
- Bucket **`onboarding-gallery` existant et public**, politiques storage déjà en place (lecture publique, écriture admin). Aucun nouveau bucket.
- RLS tables : lecture publique des éléments visibles/publiés, gestion admin. **Aucune modification RLS nécessaire.**
- `proprietes.onboarding_preferences` (jsonb) existe : c'est la cible de persistance du choix.

## 3. Matrice d'alignement (avant migration)

| Champ JSON | État | Destination |
|---|---|---|
| titre, sous-titre, ordre, actif | aligné | `titre`, `sous_titre`, `position`, `publie` |
| image grande | partiel | `image_url` (existant) |
| id stable exemple / type | **manquant** | nouvelle colonne `stable_id` |
| vignette | **manquant** | nouvelle colonne `thumbnail_url` |
| texte alternatif | **manquant** | `image_alt` |
| intention utilisateur | **manquant** | `user_intent` |
| mots-clés | **manquant** | `keywords text[]` |
| `ai_profile` | **manquant** | `ai_profile jsonb` |
| baseline, locale, périmètre climatique | **manquant** | `baseline`, `locale`, `climate_scope` (types) |
| `image_spec`, `generation_logic` | **manquant** | colonnes `jsonb` sur le type |
| id `jardin_nourricier` vs slug `nourricier` | **conflictuel** | slug conservé (utilisé par le code), `stable_id='jardin_nourricier'` ajouté |

**Alignement global avant migration : ~30 %.** Aucune table à créer : les deux tables existantes accueillent tout, sans détournement de sens.

## 4. Migration SQL (unique, non destructive, idempotente)

- `onboarding_garden_types` : `ADD COLUMN IF NOT EXISTS` → `stable_id text`, `baseline text`, `locale text`, `climate_scope text`, `image_spec jsonb`, `generation_logic jsonb` ; index unique sur `stable_id` ; `UPDATE … SET stable_id='jardin_nourricier' WHERE slug='nourricier'`.
- `onboarding_garden_examples` : `ADD COLUMN IF NOT EXISTS` → `stable_id text`, `thumbnail_url text`, `image_alt text`, `user_intent text`, `keywords text[] default '{}'`, `ai_profile jsonb` ; unicité `(type_id, stable_id)` et `(type_id, position)` (table vide : aucune violation possible).
- Aucune suppression, aucun DROP, aucun changement RLS/grants (déjà en place).
- **Retour arrière** : `ALTER TABLE … DROP COLUMN` des 12 colonnes ajoutées (aucune donnée préexistante touchée).

## 5. Import des 16 images

- Bucket `onboarding-gallery`, arborescence exacte : `garden-types/jardin_nourricier/grands/*.webp` et `garden-types/jardin_nourricier/vignettes/*.webp`, noms de fichiers conservés.
- Upload par script via l'API Storage avec une session admin mintée (`lovable auth-session`), jamais de clé service_role côté navigateur.
- Contrôle individuel des 16 objets : existence, MIME `image/webp`, taille, accessibilité publique (HTTP 200), correspondance exemple.
- En base : **URL publiques stables** du bucket (pas d'URL signées).

## 6. Import des données (run_sql, upsert relançable)

- `UPDATE` du type `nourricier` : baseline, locale `fr-FR`, climate_scope, `image_spec`, `generation_logic`, `image_url` (grand visuel n°1).
- `INSERT … ON CONFLICT (type_id, stable_id) DO UPDATE` des 8 exemples avec **tous** les champs, accents et apostrophes typographiques préservés à l'octet près.
- Vérifications post-import : 1 type, 8 exemples actifs, ordres 1→8 sans doublon, 16 chemins images cohérents, mots-clés et `ai_profile` valides, aucune duplication. Les 6 autres types restent intacts.

## 7. Écran de sélection dans `/jardin/demarrer`

- Nouvelle étape optionnelle « Quel potager vous fait rêver ? » dans le flux de création : le type Jardin nourricier ouvre les **8 cartes** (vignette, titre, sous-titre, état sélectionné bien visible), données lues depuis Supabase — **rien en dur**.
- Clic sur une carte → **visionneuse grand format 1536 × 1024** avec la phrase d'intention, navigation précédent/suivant, mobile first.
- Sélection → enregistrement de l'**id stable** dans `proprietes.onboarding_preferences` (`{ garden_type: 'jardin_nourricier', example_id, selected_at }`), relu au chargement : le choix survit au rafraîchissement et à la reconnexion.
- Données disponibles pour le futur moteur : `ai_profile`, `keywords`, `generation_logic` — la préférence reste croisée avec géolocalisation, surface, sol, eau, temps, etc. (règles déjà stockées).

## 8. Admin → Onboarding enrichi

- Formulaire type : baseline, locale, périmètre climatique, `image_spec` et `generation_logic` (éditeurs JSON assistés).
- Formulaire exemple : vignette (upload + repli URL via le composant existant), alt, intention, mots-clés (chips), `ai_profile` (JSON assisté), position, publié.
- Les sauvegardes restent des updates partiels : aucun champ riche n'est perdu.

## 9. Tests réels avant validation

- **Données** : requêtes de comptage, unicité, ordre, relations, contenu `ai_profile` / `generation_logic`.
- **Images** : contrôle HTTP des 16 URL + affichage navigateur sans image cassée.
- **Interface (Playwright, desktop + mobile)** : 8 cartes, visionneuse, sélection, persistance après rafraîchissement, états de chargement/erreur, console propre.
- **Sécurité** : visiteur anonyme lit les exemples publiés, ne peut rien écrire ; un utilisateur ne modifie que ses propres `onboarding_preferences` ; admin conserve la gestion.

## Détails techniques

- Migration via l'outil de migration (validation utilisateur) ; données via `run_sql` ; images via Storage REST + session admin.
- `src/hooks/onboarding/useOnboardingConfig.ts` : interfaces étendues (`stable_id`, `thumbnail_url`, `image_alt`, `user_intent`, `keywords`, `ai_profile`, champs types).
- `src/pages/JardinDemarrer.tsx` : nouvelle étape galerie + composants `GardenExampleGallery.tsx` / `GardenExampleViewer.tsx` (sous `src/components/onboarding/`).
- `src/pages/AdminOnboarding.tsx` : champs riches ajoutés aux deux formulaires.
- Aucune URL publique existante modifiée ; aucune donnée des 6 autres types touchée.

## Compte rendu final

Rapport structuré livré en fin de mission : inventaire ZIP, matrice d'alignement, migration appliquée, chemins Storage, résultat par exemple et par image, tests exécutés et leurs résultats, procédure de retour arrière.
