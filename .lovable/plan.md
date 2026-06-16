## Partie 1 — Réponses à tes questions sur /admin/adhesions

### Que signifie `Statut = linked` ?

Dans `adhesion_requests.status` il y a aujourd'hui 2 valeurs, posées automatiquement par l'edge function `submit-adhesion` :

- `**pending**` → la demande a été enregistrée mais l'email n'a **pas été retrouvé** dans `auth.users`. Aucun profil n'est mis à jour. C'est une demande "orpheline" en attente de rattachement.
- `**linked**` → l'email correspond à un compte existant. La fonction a alors **mis à jour automatiquement** `community_profiles` :
  - `is_adherent = true`
  - `college_adhesion = 'actifs'` (toujours Actifs par défaut, jamais Fondateurs ni Partenaires)
  - `adhesion_date`, `adhesion_source`, `adhesion_campaign`, `rgpd_newsletter_consent`
  - fusion des `types_marches_interets`

Donc `**linked` = adhésion déjà active côté profil**, dans le Collège des Actifs.

### Que doit faire un admin pour "valider" une adhésion ?

Aujourd'hui : **rien n'est prévu dans l'UI**.

- Si `linked` → c'est déjà fait automatiquement, rien à valider.
- Si `pending` → aucun bouton n'existe pour rattacher la demande à un profil ou créer un profil. Il faut le faire à la main en BDD.

C'est un manque réel : il n'y a ni bouton "Valider", ni "Rattacher au profil X", ni "Refuser".

### Comment affecter un adhérent au Collège Fondateurs ou Partenaires & Mécènes ?

Aujourd'hui : **il n'existe aucune UI pour ça**.

- Le formulaire public force `actifs` (et ignore `college_demande` même s'il est envoyé).
- Le `MarcheurEditSheet` de /admin/community n'expose pas `college_adhesion` ni `is_adherent`.
- Il faut donc passer par SQL pour mettre `college_adhesion = 'fondateurs'` ou `'partenaires_mecenes'`.

---

## Partie 2 — Plan : filtre "Adhésion" sur /admin/community + complément admin

### Objectif UX

Permettre à l'admin, depuis la mosaïque des marcheurs, de :

1. **Filtrer** rapidement : Tous / Adhérent·e / Non adhérent·e (+ par collège).
2. **Voir au premier coup d'œil** qui est adhérent (badge sur la carte).
3. **Modifier l'adhésion** d'un profil (passer en Actifs / Fondateurs / Partenaires, ou retirer), ce qui répond aussi à ta question "comment affecter un collège".

### Analyse UX/UI (principe de sobriété informationnelle)

**Où placer le filtre ?**
Sur `/admin/community` → onglet Profils → composant `ProfilsMosaique.tsx`. La barre de filtres compte déjà : recherche, âge, genre, CSP, rôle, réseaux scientifiques, spéciaux. Ajouter un 7ᵉ Select ferait trop. Solution la plus lisible **et la plus utile pour des séniors** :

- **Une ligne dédiée "Adhésion"** sous la ligne des réseaux scientifiques, en **chips segmentées** (pas un Select caché) :
`[ Tous · 124 ]  [ ✓ Adhérent·e · 38 ]  [ — Non adhérent·e · 86 ]`
- À droite des chips, **3 mini-chips de collège** (apparaissent uniquement si "Adhérent·e" est actif) :
`[ Actifs · 32 ]  [ Fondateurs · 4 ]  [ Partenaires & Mécènes · 2 ]`
- Compteurs live (comme `NetworkFilters`), pour que l'admin voie l'impact du filtre avant de cliquer.
- État par défaut : "Tous" (ne change pas l'affichage actuel).

**Identification visuelle sur la carte (`ProfilCard`)**

- Petit badge cœur 🤍 en haut à droite quand `is_adherent = true`, couleur dépend du collège :
  - Actifs → emerald (cohérent rôle marcheur)
  - Fondateurs → amber (cohérent avec design system existant)
  - Partenaires & Mécènes → sky
- Tooltip au survol : "Adhérent·e — Collège des Actifs depuis 12/03/2026"
- Pas de badge si non adhérent (sobriété).

**Édition (réponse à "comment affecter un collège")**
Dans `MarcheurEditSheet`, ajouter une section **"Adhésion association"** repliable :

- Toggle `is_adherent`
- Si ON → Select `college_adhesion` : Actifs / Fondateurs / Partenaires & Mécènes
- Champ lecture seule `adhesion_date` (rempli auto au passage ON, modifiable)
- Champ `adhesion_numero` (lecture seule, déjà existant)
- Note RGPD : "La modification est journalisée dans `admin_audit_log`."

### Détails techniques

1. `**src/components/admin/community/ProfilsMosaique.tsx**`
  - Ajouter state `adhesionFilter: 'all' | 'yes' | 'no'` et `collegeFilter: 'all' | 'actifs' | 'fondateurs' | 'partenaires_mecenes'`.
  - Calculer `adhesionCounts` à partir de `enriched`.
  - Étendre la closure `filtered` avec les 2 conditions.
  - Nouveau composant inline (ou `AdhesionFilters.tsx` à côté de `NetworkFilters.tsx`) qui rend les 2 lignes de chips, réutilisant la même esthétique que `NetworkFilters` pour cohérence visuelle.
2. `**src/components/admin/community/ProfilCard.tsx**` (à lire/adapter)
  - Si `profile.is_adherent` → afficher un `Badge` cœur en absolute top-right, couleur via map `COLLEGE_COLORS`.
3. `**src/components/admin/community/MarcheurEditSheet.tsx**` (à lire/adapter)
  - Étendre `EditableProfile` (ou son type) avec `is_adherent`, `college_adhesion`, `adhesion_date`, `adhesion_numero`.
  - Nouvelle section "Adhésion association" avec Toggle + Select.
  - Au save, update `community_profiles` (le user est admin, RLS le permet déjà via `is_admin`).
  - Logger dans `admin_audit_log` (helper existant probable, à vérifier).
4. `**src/components/admin/community/ProfilsPanel.tsx**`
  - Étendre le SELECT pour inclure `is_adherent, college_adhesion, adhesion_date, adhesion_numero` (actuellement `select('*')` → déjà inclus, vérifier).
5. **Aucune migration DB** : tout existe déjà (`is_adherent`, `college_adhesion` enum, `adhesion_date`, `adhesion_numero`).
6. **Réponse à la question "valider"** : hors scope de ce plan (à traiter dans un 2ᵉ ticket), mais la nouvelle section "Adhésion" du Sheet permet déjà en pratique de valider manuellement un `pending` : l'admin ouvre le profil correspondant, coche `is_adherent` + choisit le collège.

### Hors-scope (à traiter plus tard si tu veux)

- Bouton "Rattacher" / "Valider" sur la table `pending` dans /admin/adhesions.
- Création de profil depuis un `pending` quand aucun compte n'existe.
- Export CSV des adhérent·e·s par collège.

---

**Questions avant que je passe en build :**

1. **Couleurs de collège** OK avec ma proposition (Actifs=emerald, Fondateurs=amber, Partenaires=sky) ?
2. OUI, ajoute aussi maintenant le **bouton "Valider / Rattacher"** sur l'onglet Demandes de /admin/adhesions