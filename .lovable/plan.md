## Page `/adhesion` — modifications

### 1. Texte (src/pages/Adhesion.tsx)
- Remplacer le H1 **« Devenez marcheur de la Fréquence du Vivant »** par **« Rejoindre l'association la Fréquence du Vivant »** (mot « association » mis en accent émeraude pour garder le rythme visuel).
- Supprimer entièrement le bloc des 3 cartes collèges (Fondateurs / Adhérents Actifs / Partenaires & Mécènes) ainsi que le composant `CollegeCard` devenu inutile.
- Conserver le bandeau « Association loi 1901 » + sous-titre + formulaire.

### Bug 1 — UI mobile (chips « types de marche »)
Dans `AdhesionDialog.tsx` (et donc aussi sur la page), la grille des chips utilise `grid-cols-2 gap-2` sans contrainte de débordement → sur petits écrans le label « Agroécologique » + emoji touche le bord droit.

Corrections (frontend uniquement) :
- Conteneur formulaire : passer le padding mobile de `p-5` à `p-4 sm:p-8` côté page, et ajouter `px-4 sm:px-6` au wrapper interne pour garantir un gouttière confortable.
- Chips : 
  - `grid-cols-1 sm:grid-cols-2` (1 colonne en mobile, pleine largeur, plus lisible séniors)
  - augmenter le tap target : `px-4 py-3 text-base` (au lieu de `px-3 py-2 text-sm`)
  - `min-h-[52px]` pour respect des recommandations WCAG « senior friendly »
  - `truncate` sur le label + `shrink-0` sur l'emoji pour éviter tout débordement résiduel.
- Même traitement appliqué aux cartes de collèges du formulaire (radios) pour cohérence tactile.

### Bug 2 — « Une erreur est survenue » quand l'email existe déjà
Diagnostic : pour `victor.boixeda@gmail.com` le profil existe (`is_adherent=false`). L'edge function `submit-adhesion` trouve bien le profil via `auth.admin.listUsers` puis tente un `UPDATE community_profiles`. Cet UPDATE déclenche le **trigger de promotion de rôle** (`role-promotion-only-trigger` cf. mémoire) qui peut échouer ou lever une exception transmise au client → réponse 500 → toast d'erreur, alors que la demande a déjà été enregistrée dans `adhesion_requests`.

Correctifs côté edge function `supabase/functions/submit-adhesion/index.ts` (aucun changement de schéma) :
1. **Toujours répondre `ok:true`** dès lors que l'insert dans `adhesion_requests` réussit. Le matching/update profil devient *best-effort*.
2. **Isoler l'UPDATE profil dans un try/catch interne** : si erreur → `outcome:'pending'` + log serveur, mais pas d'échec HTTP.
3. **Pré-charger le profil existant** avant l'update pour ne patcher que les champs réellement vides (ne pas écraser `telephone`/`ville` déjà renseignés).
4. **Pagination listUsers** : passer à `perPage: 1000` (46 users aujourd'hui mais filet de sécurité), et fallback : si non trouvé en page 1, itérer jusqu'à 3 pages.
5. Côté frontend (`AdhesionDialog.tsx`) : afficher le bon écran de succès dès que `data.ok === true`, en s'appuyant sur `outcome` (`linked` vs `pending`) — déjà le cas, mais s'assurer qu'aucune exception réseau résiduelle ne fasse tomber dans le `catch`.

### Vérifications
- Re-tester `/adhesion?src=qr&campaign=flyer-devenez-marcheur` avec `victor.boixeda@gmail.com` → écran « Vous êtes maintenant en résonance » + ligne en BDD.
- Inspection mobile (375px) : chips une par ligne, padding latéral confortable, aucun élément au bord.
- Logs edge function : un warning éventuel si l'update profil échoue, mais HTTP 200.

### Fichiers touchés
- `src/pages/Adhesion.tsx` (texte + suppression cartes)
- `src/components/adhesion/AdhesionDialog.tsx` (chips mobile, radios)
- `supabase/functions/submit-adhesion/index.ts` (robustesse update profil)

Aucune migration SQL nécessaire.
