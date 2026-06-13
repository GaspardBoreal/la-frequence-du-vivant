## Diagnostic

Test API gouv direct avec uniquement `departement=33&activite_principale=01.21Z` → **retourne bien des viticulteurs** (SCEA DES VIGNOBLES MOURGUES, etc.). L'API n'est pas en cause.

Les logs edge function du 13/06 montrent l'URL réellement envoyée :
```
/search?per_page=20&page=1&departement=33&activite_principale=01.21Z&q=Culture+de+la+vigne
```
👉 Un texte `q=Culture de la vigne` est ajouté à la requête. Avec ce `q`, l'API filtre en plus sur le **nom** de l'entreprise contenant ces mots → **0 résultat** (les viticulteurs ne s'appellent quasi jamais "Culture de la vigne SARL").

**Cause** : le champ "Nom, SIREN, dirigeant…" en haut de l'Annuaire conserve le texte saisi précédemment (probablement "Culture de la vigne" tapé par l'utilisateur pour tester). Visuellement l'utilisateur a l'impression de n'avoir mis que les 2 filtres mais le `q` reste actif et est combiné en ET logique avec les filtres.

Un second log montre aussi `categorie_juridique=01.21Z` (le code NAF dupliqué dans le champ Forme juridique), preuve qu'il y a un risque de pollution de filtres latents.

## Plan de correction

### 1. Rendre les filtres actifs visibles et effaçables (CrmAnnuaire.tsx)
Sous la barre de recherche, afficher une rangée de **chips** pour chaque filtre actif (y compris `q`), chacun avec une croix pour le retirer individuellement, plus un bouton "Tout effacer". Cela évite que l'utilisateur ne se rende pas compte qu'un filtre invisible (texte `q` ou filtre du drawer) bride sa recherche.

Exemples de chips :
- `Recherche : "Culture de la vigne" ×`
- `Département : 33 — GIRONDE ×`
- `NAF : 01.21Z ×`

### 2. Bouton "×" dans l'Input de recherche
Ajouter une croix à droite du champ texte quand `q` n'est pas vide, pour vider rapidement.

### 3. Empêcher la pollution Forme juridique ↔ NAF
Dans `CompanySearchFiltersDrawer.tsx`, l'utilisateur a manifestement collé le NAF dans le champ Forme juridique par confusion. Ajouter :
- Validation visuelle : `categorie_juridique` attend 4 chiffres → si la saisie ne matche pas `/^\d{4}$/`, afficher un hint rouge "Ex : 5710 (SAS) — code à 4 chiffres".
- Placeholder plus explicite : "ex : 5710 (SAS), 5499 (autre SA)…"

### 4. Banner "X résultats trouvés" plus contextuel
Quand `total === 0`, afficher une carte qui liste les filtres actifs et propose : "Essayer sans le filtre **Recherche** ?" (bouton qui retire juste `q`). Ainsi l'utilisateur comprend immédiatement quel filtre est trop restrictif.

### 5. (Optionnel) Logger côté edge function les filtres ignorés
Aujourd'hui l'edge function envoie tels quels tous les paramètres à l'API gouv. Ajouter dans la réponse `applied_filters: {...}` permettrait au front d'afficher exactement ce qui a été envoyé. Non bloquant.

## Fichiers touchés

- `src/pages/CrmAnnuaire.tsx` — chips de filtres actifs + bouton clear sur l'Input + banner "0 résultat" intelligent
- `src/components/crm/CompanySearchFiltersDrawer.tsx` — placeholder + validation visuelle du code juridique

Aucun changement de schéma DB ni de migration nécessaire.

## Hors scope

- Refonte de l'API gouv (déjà OK)
- Phase B (pipeline, IA) tant que l'Annuaire n'est pas stabilisé
