# Onboarding → Exemples : trois sous-menus de consultation

Aujourd'hui l'onglet « Exemples » affiche une seule vue : les exemples empilés par type de jardin. On le transforme en trois sous-menus : **Type** (la vue actuelle, renommée), **Vignette** (mur de vignettes paginé), et **Boussole** (exploration par facettes sur toutes les métadonnées).

## 1. Sous-navigation

- L'onglet « Exemples » ouvre une barre de trois sous-menus en tête : **Type** · **Vignette** · **Boussole**.
- La carte d'import ZIP (`LotImportCard`) reste visible en haut, commune aux trois vues : on importe une fois, on consulte partout.
- Le sous-menu actif et la page courante restent dans l'URL (`es`, `ep`, `eps`), pour pouvoir partager un lien direct vers une vue précise sans casser les URL existantes.

## 2. Sous-menu « Type » — la vue actuelle

- Reprise à l'identique : une carte par type de jardin, exemples dans l'ordre de position, actions Modifier / Supprimer / Couverture / Source.
- Aucun changement de comportement, seulement le déplacement dans le sous-menu.

## 3. Sous-menu « Vignette » — le mur paginé

- Tous les exemples dépliés en un seul mur de vignettes, **triés dans l'ordre des types** (position du type, puis position de l'exemple dans son type) : on « fait défiler » les types les uns après les autres.
- Sous chaque vignette, mention discrète : **nom de l'exemple** suivi du type entre parenthèses, en petit corps atténué (ex. « Potager en carrés *(Jardin nourricier)* »).
- Pagination identique en esprit au Journal : choix de la taille de page **2 · 4 · 8 · 16**, **8 par défaut**, avec navigation première / précédente / « x–y sur N » / suivante / dernière.
- Grille responsive mobile first : 2 vignettes en mobile, 4 en bureau (8 par page = deux lignes nettes).
- Les exemples masqués (non publiés) restent visibles pour l'admin avec un badge « masqué » discret.
- Clic sur une vignette : ouverture de la visionneuse plein écran existante (`GardenExampleViewer`) avec précédent / suivant calé sur la page courante.
- Actions d'édition (crayon / corbeille) conservées au survol ou au tap long, pour ne pas perdre la gestion.

## 4. Sous-menu « Boussole » — trouver l'exemple qui nous correspond

Le nom : une boussole, parce que cette vue sert à s'orienter dans la collection et à découvrir l'exemple qui résonne avec un besoin — pas à administrer ligne par ligne.

### Tête de boussole
- Un compteur vivant : « **N exemples répondent présents** » qui se met à jour à chaque critère touché, avec un geste « Tout effacer ».
- Un champ **« le nom contient… »** : recherche instantanée sur le titre de l'exemple (insensible aux accents, NFD comme partout dans le projet).

### Constellation de facettes (toutes les métadonnées des images)
- **Mots-clés** : l'union de tous les `keywords` de la collection, présentés en pastilles cliquables multi-sélection, triées par fréquence, chacune portant son nombre d'exemples. Les pastilles actives s'illuminent, les pastilles qui ne mèneraient à aucun résultat s'estompent (sélection toujours cohérente, jamais de cul-de-sac).
- **Type de jardin** : pastilles par type (avec leur nombre d'exemples).
- **Intention** (« ce que le jardinier cherchait ») : facettes dérivées des `user_intent` présents.
- **Personas** : facettes dérivées des personas des types rattachés.
- **État** : Publié / Masqué · **Matière** : Avec photo / Sans photo · Avec source externe.
- **Recherche libre** en plus du nom : un second champ qui balaie sous-titre, description, légende (`image_alt`), intention et profil IA — pour retrouver un exemple dont on se souvient d'un mot (« argile », « balcon », « haie »).

### Résultats
- Grille de vignettes identique à celle du sous-menu Vignette, **triée par pertinence** : correspondance dans le nom > mot-clé > texte libre. Le terme cherché est surligné dans le nom affiché.
- Compteur par facette recalculé en direct ; clic sur une vignette = visionneuse plein écran.
- Si aucun critère n'est posé, la Boussole affiche toute la collection (ordre des types), avec une invitation douce : « Posez un premier critère… ».

## Détails techniques

- `src/pages/AdminOnboarding.tsx` : le `TabsContent value="exemples"` devient un conteneur à sous-onglets ; l'état (`es` vue, `ep` page, `eps` taille) via `useSearchParams` en `replace: true`, paramètres absents quand valeur par défaut.
- Extraction des trois vues dans `src/components/onboarding/admin/` : `ExamplesTypeView.tsx` (déplacement du code actuel, sans logique nouvelle), `ExamplesVignetteView.tsx`, `ExamplesBoussoleView.tsx`.
- `ExamplesVignetteView` : `useMemo` qui aplatit `types` triés par position → exemples triés par position ; découpe `slice((page-1)*size, page*size)` ; retour à la page 1 au changement de taille ; retour à la dernière page existante si la page devient vide après suppression.
- `PaginationControls` (`@/components/admin/marche-events/PaginationControls`) : ajout d'une prop optionnelle `pageSizeOptions` (défaut = valeurs actuelles 10/20/50/100, aucune régression sur les écrans existants) ; la vue Vignette passe `[2, 4, 8, 16]`.
- `ExamplesBoussoleView` : filtrage 100 % local (toute la collection est déjà en mémoire via `useOnboardingGallery`) ; normalisation NFD + casse pour « nom contient » et recherche libre ; score de pertinence simple et explicable ; décomptes de facettes calculés sur le sous-ensemble filtré par les *autres* facettes (facettes toujours cliquables utilement).
- Réutilisation de `GardenExampleViewer` pour le plein écran (déjà livré, navigation clavier incluse).
- Aucune migration SQL, aucune modification de base, aucun changement d'URL publique : tout est lecture seule sur des données déjà chargées.

## Ce que ça ne fait pas

Ça ne change ni l'import ZIP, ni les formulaires d'édition, ni la galerie publique `/jardin/demarrer`. La vue « Type » reste le seul endroit où l'on ajoute un exemple à un type.
