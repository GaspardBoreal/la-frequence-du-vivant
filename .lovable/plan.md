## Diagnostic du bug

Dans la marche DEVIAT, le texte "Pissenlit" a été ré-attribué à Karine Log via le bouton « Crédit ». Pourtant la liste « Marcheurs » montre 3 textes pour Gaspard Boréal et 0 pour Karine. Le panneau de Gaspard, lui, n'en affiche que 2 (filtre `effectiveAuthor` correctement appliqué). Trois bugs convergent.

### Bug 1 — Le compteur global ignore la ré-attribution des textes

`src/hooks/useExplorationParticipants.ts` (lignes 165-168) :

```text
(textes || []).forEach((t: any) => {
  if (!t.user_id) return;
  ensureUser(t.user_id).textes++;   // ← ignore attributed_user_id
});
```

Pour les **photos** et **audio**, le code passe par `route(uploaderId, attributed_marcheur_id)` qui résout vers le bon bucket. Pour les **textes**, on incrémente toujours `user_id` (le typeur). Résultat : le texte « Pissenlit » reste compté chez Gaspard.

### Bug 2 — Asymétrie de schéma : textes vs photos/audio

| Table | `user_id` | `attributed_marcheur_id` (crew) | `attributed_user_id` (auth) |
|---|---|---|---|
| `marcheur_medias` | oui | oui | non |
| `marcheur_audio` | oui | oui | non |
| `marcheur_textes` | oui | **non** | oui (ajouté la dernière fois) |

Conséquence : un texte ne peut être ré-attribué qu'à une personne disposant d'un compte `auth.users`. Karine Log n'a pas de compte → la ré-attribution actuelle ne peut pas lui « donner » le texte de manière propre. Si l'attribution affichée dans le panneau de marche provient d'un autre champ (lien fragile via `metadata`, ou via le crew row), le compteur global reste incohérent.

### Bug 3 — Les listes par marcheur n'utilisent pas la même règle de routage

`TextesSubTab` (MarcheursTab.tsx l. 847-862) requête par `user_id.eq OR attributed_user_id.eq` puis filtre `effectiveAuthor = attributed_user_id ?? user_id`. Les photos/audio dans `MarcheDetailModal` et `MarcheurAudioPanel` utilisent une **autre** clé (`attributed_marcheur_id` → `crewId/userId` via `route()`). Trois implémentations concurrentes = trois résultats divergents.

---

## Plan de correction

### Étape 1 — Unifier le schéma (migration SQL)

Ajouter `attributed_marcheur_id` sur `marcheur_textes` pour aligner les 3 médias :

```text
ALTER TABLE marcheur_textes
  ADD COLUMN attributed_marcheur_id uuid
  REFERENCES exploration_marcheurs(id) ON DELETE SET NULL;
CREATE INDEX ... ON marcheur_textes(attributed_marcheur_id) WHERE NOT NULL;
```

Garder `attributed_user_id` (rétro-compatibilité). La règle de résolution devient :

```text
effectiveCrewId = attributed_marcheur_id
effectiveUserId = attributed_user_id ?? user_id
```

### Étape 2 — Mettre à jour la RPC `reattribute_media` (source='texte')

La fonction doit, pour les textes :
- Si la cible est un crew row sans compte → écrire `attributed_marcheur_id` (et nettoyer `attributed_user_id`).
- Si la cible est un crew row lié à un user → écrire les **deux** colonnes (cohérence).
- Si la cible est un user pur → écrire `attributed_user_id` seul.

Cela débloque la ré-attribution vers Karine Log (crew sans compte).

### Étape 3 — Centraliser la fonction `route()` (helper partagé)

Créer `src/utils/mediaRouting.ts` exportant :

```text
type Routed = { userId: string | null; crewId: string | null };
routeMedia(uploaderId, attributedCrewId, opts):  Routed   // photos/audio
routeTexte(uploaderId, attributedCrewId, attributedUserId, opts): Routed
```

avec `opts` contenant `crewUserByCrewId` et `crewIdByUserId` pour fusionner crew↔user. Une seule source de vérité, importée partout.

### Étape 4 — Corriger `useExplorationParticipants.ts`

- Ajouter `attributed_marcheur_id` et `attributed_user_id` au SELECT des textes.
- Remplacer la boucle textes par le même pattern que photos :

```text
(textes || []).forEach((t) => {
  const { userId, crewId } = routeTexte(t.user_id, t.attributed_marcheur_id, t.attributed_user_id, opts);
  const bucket = userId ? ensureUser(userId) : crewId ? ensureCrew(crewId) : null;
  if (bucket) bucket.textes++;
});
```

### Étape 5 — Aligner les vues détail

- `TextesSubTab` (MarcheursTab.tsx) : filtrer via `routeTexte(...)` au lieu du `effectiveAuthor` ad-hoc, afin de gérer aussi les marcheurs crew sans compte (`crewId === marcheur.crewId`).
- `MarcheDetailModal` (section textes, groupes « Crédité à … ») : grouper par `routeTexte(...)` au lieu de `attributed_user_id ?? user_id`.
- `MarcheurAudioPanel` et `ContributionItem` : harmoniser sur le même helper (déjà très proches).

### Étape 6 — Invalidations cache

Compléter `useReattributeMedia` pour invalider également :
- `['exploration-participants', explorationId]` (compteurs de la liste Marcheurs).
- `['marcheur-textes-exploration']` et `['marcheur-textes', marcheEventId]`.

### Étape 7 — Vérification ciblée

1. Ouvrir DEVIAT → onglet Marcheurs : Gaspard doit afficher **2 textes**, Karine **1**.
2. Cliquer Karine → onglet Textes : « Pissenlit » visible, badge « Crédité ».
3. Cliquer Gaspard → onglet Textes : « Pissenlit » absent, les 2 autres présents.
4. Le panneau Marche → groupe « Crédité à Karine L (1) » présent dans la section textes.
5. Photos et audio : aucun changement de comportement (régression check).

---

## Détails techniques

- Migration idempotente (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Pas de back-fill nécessaire : les textes existants conservent leur `attributed_user_id` (compatible avec la nouvelle règle).
- Le helper `routeTexte` priorise `attributed_marcheur_id` (la convention crew-first des photos/audio), ce qui garantit que si un curateur change d'avis et choisit un crew row, c'est lui qui gagne.
- Tous les fichiers touchés sont front + 1 migration + 1 update de RPC. Aucun changement de Storage.