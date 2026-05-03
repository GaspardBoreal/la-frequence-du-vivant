## Objectif

Permettre d'ajouter/éditer un **descriptif riche** (gras / italique / souligné) à chaque son affiché dans `Marcheurs > Marcheurs > Écoute` (et dans `Marches > Voir > Écouter` puisque le composant est partagé), avec règles :

- **Propriétaire du son** : peut éditer le descriptif de ses propres sons.
- **Ambassadeur, Sentinelle, Administrateur** : peuvent éditer le descriptif de **tous** les sons.
- **Marcheur standard** : lecture seule.

## 1. Backend (migration Supabase)

La colonne `marcheur_audio.description` existe déjà (cf. `useMarcheurContributions.ts`). On ajoute uniquement les permissions élevées :

a) **Fonction SECURITY DEFINER** `can_curate_audio(_user_id uuid)` → `boolean`  
   Réutilise la logique de `can_upload_convivialite` (sans dépendance exploration_id) :
   - admin via `check_is_admin_user`
   - `community_profiles.role IN ('ambassadeur', 'sentinelle')`

b) **Policy RLS UPDATE** sur `public.marcheur_audio` :  
   `CREATE POLICY "Curators can update audio descriptions" ON marcheur_audio FOR UPDATE USING (can_curate_audio(auth.uid())) WITH CHECK (can_curate_audio(auth.uid()));`  
   Les propriétaires gardent leur policy existante "Users update own audio". Les admins gardent "Admins full access audio".

c) **Trigger garde-fou** `BEFORE UPDATE` sur `marcheur_audio` : si l'appelant n'est ni propriétaire ni curator, autoriser uniquement la modification de `description` / `updated_at` (interdit changements de `is_public`, `url_fichier`, `marche_event_id`, etc.). Évite qu'un ambassadeur escalade au-delà du périmètre demandé.

## 2. Composant partagé `MarcheurAudioPanel.tsx`

- Récupérer le rôle viewer via un nouveau hook léger `useCanCurateAudio()` (query sur `community_profiles` + `check_is_admin_user`, cache 60s, déjà appelé une fois au montage du panel).
- Pour chaque son rendu (`Mes sons` ET `Des marcheurs`) :
  - Calcul `canEditDescription = isOwner || canCurate`.
  - Sous le lecteur `<audio>`, afficher la description en HTML sanitizé (`DOMPurify` déjà utilisé via `htmlSanitizer.ts`) avec classe `prose-sm`.
  - Bouton crayon **"Décrire"** visible si `canEditDescription`.
  - En mode édition : `RichTextEditor` (`@/components/ui/rich-text-editor`) avec toolbar Gras/Italique/Souligné, hauteur min 80 px, **mobile first** (toolbar sticky en haut du champ, boutons ≥ 40 px tactiles).
  - Boutons Enregistrer / Annuler. Save → `useUpdateContribution({ table: 'marcheur_audio', id, updates: { description } })`.

## 3. UX / UI mobile-first

```text
┌───────────────────────────────┐
│ ▶ ──────●─────  0:42 / 1:30  │  lecteur audio
├───────────────────────────────┤
│ 🎵 Pouillot Véloce  · 03 mai │
│ ┌───────────────────────────┐ │
│ │ Chant entendu près du     │ │  description (HTML)
│ │ sentier, **très clair**.  │ │
│ └───────────────────────────┘ │
│                       [✎]    │  bouton "Décrire" (si droits)
└───────────────────────────────┘
```

En mode édition :

```text
┌───────────────────────────────┐
│ [B] [I] [U]            [×]   │  toolbar sticky
│ ┌───────────────────────────┐ │
│ │ contentEditable…          │ │
│ └───────────────────────────┘ │
│           [Annuler] [Enreg.] │
└───────────────────────────────┘
```

- États visibles : vide → placeholder `Ajouter un descriptif…` (italique, opacity 50).  
- Curators (non-owner) : badge discret `Édition curatoriale` à côté du crayon pour transparence.  
- Sanitize : whitelist `<b>, <strong>, <i>, <em>, <u>, <br>, <p>` uniquement.  
- Accessibilité : raccourcis Ctrl/Cmd + B/I/U déjà gérés par `RichTextEditor`.

## 4. Fichiers touchés

- **Migration** : `supabase/migrations/<ts>_marcheur_audio_description_curators.sql` (fonction + policy + trigger garde-fou).
- **Hook nouveau** : `src/hooks/useCanCurateAudio.ts`.
- **Édité** : `src/components/community/audio/MarcheurAudioPanel.tsx` — bloc description + édition pour chaque item, remplace le rendu actuel par un sous-composant `<AudioDescriptionBlock />` factorisé en bas du fichier.
- **Réutilisé sans modification** : `MarcheDetailModal.tsx` (déjà sur `MarcheurAudioPanel`) bénéficie automatiquement.

## 5. Invalidations & cache

`useUpdateContribution` invalide déjà `['marcheur-audio']`. Ajouter aussi `['marcheur-panel-owner-audio']` (key utilisée par le panel) dans son `onSuccess` pour rafraîchir immédiatement la vue.

## 6. Mémoire

Mettre à jour `mem://features/community/walker-engagement-tracking-logic` ou créer `mem://features/community/marcheur-audio-description-logic` pour documenter : descriptif riche, droits owner + ambassadeur/sentinelle/admin, sanitisation HTML.
