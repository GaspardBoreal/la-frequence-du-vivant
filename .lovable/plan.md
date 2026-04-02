

## Permettre aux Ambassadeurs/Sentinelles de déclencher la collecte biodiversité d'un événement

### Contexte actuel

- La collecte biodiversité passe par l'edge function `collect-biodiversity-step`, réservée aux **admins** (`validateAuth` + `isAdmin`)
- L'admin lance la collecte depuis `DataCollectionPanel.tsx` (interface admin)
- L'onglet Empreinte affiche "en attente" tant qu'aucun `biodiversity_snapshot` n'existe pour les marches de l'exploration
- Les utilisateurs Ambassadeur/Sentinelle n'ont **aucun moyen** de déclencher cette collecte

### Architecture proposée

```text
EventBiodiversityTab (empty state)
  └── Bouton "Révéler l'empreinte" (visible Ambassadeur/Sentinelle)
        └── Animation rituelle immersive (3-4 secondes)
              └── Appel edge function collect-event-biodiversity
                    └── Vérifie rôle communautaire (ambassadeur/sentinelle)
                    └── Itère sur les marches de l'exploration
                    └── Appelle biodiversity-data pour chaque marche
                    └── Insère les biodiversity_snapshots
                    └── Retourne le résultat
              └── Invalidation du cache React Query
              └── Affichage progressif des données
```

### 1. Nouvelle edge function : `collect-event-biodiversity`

**Fichier** : `supabase/functions/collect-event-biodiversity/index.ts`

- Reçoit `{ explorationId }` dans le body
- Vérifie l'authentification JWT (utilisateur connecté)
- Vérifie le rôle communautaire via query sur `community_profiles` : seuls `ambassadeur` et `sentinelle` (+ admins) peuvent déclencher
- Récupère les `exploration_marches` → `marches` (coordonnées)
- Pour chaque marche sans snapshot existant : appelle `biodiversity-data`, insère le snapshot
- Retourne un résumé `{ marchesProcessed, totalSpecies, errors }`
- Protections : rate limiting simple (vérifie si un snapshot récent < 24h existe déjà)

### 2. Modification de `auth-helper.ts`

Ajouter une fonction helper `validateCommunityRole` qui vérifie le rôle communautaire d'un utilisateur :

```ts
export async function validateCommunityRole(userId: string, allowedRoles: string[]) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('community_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  return allowedRoles.includes(data?.role);
}
```

### 3. UI : Bouton rituel dans l'empty state d'Empreinte

**Fichier** : `src/components/community/EventBiodiversityTab.tsx`

Dans l'empty state actuel (lignes 171-189), ajouter conditionnellement un bouton pour les Ambassadeurs/Sentinelles :

- Hook `useQuery` sur `community_profiles` pour vérifier le rôle de l'utilisateur courant
- Si rôle `ambassadeur` ou `sentinelle` : afficher un bouton design "Révéler l'empreinte vivante"
- Design du bouton :
  - Icône feuille animée avec pulse doux
  - Bordure gradient emerald → amber
  - Texte poétique : "Révéler l'empreinte vivante de cet événement"
  - Sous-texte : "Collecte les données de biodiversité de toutes les étapes"

### 4. Animation rituelle pendant la collecte

**Fichier** : `src/components/community/BiodiversityRevealAnimation.tsx` (nouveau)

Quand le bouton est cliqué :
- Modal/overlay plein écran semi-transparent
- Animation de "scan du territoire" :
  - Cercle concentrique qui pulse (rappelant un sonar bioacoustique)
  - Compteur animé : "Exploration de l'étape 3/10 — Château de Chiré..."
  - Icônes d'espèces qui apparaissent progressivement autour du cercle
  - Barre de progression organique (courbe, pas linéaire)
- Texte poétique qui change : "Écoute du territoire...", "Recueil des présences...", "Tissage de l'empreinte..."
- À la fin : explosion douce de particules vertes + affichage du résumé
  - "28 espèces révélées sur 10 étapes"
  - Transition fluide vers l'onglet Synthèse

### 5. Hook de collecte

**Fichier** : `src/hooks/useTriggerBiodiversityCollection.ts` (nouveau)

```ts
export const useTriggerBiodiversityCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (explorationId: string) => {
      const { data, error } = await supabase.functions.invoke('collect-event-biodiversity', {
        body: { explorationId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, explorationId) => {
      queryClient.invalidateQueries({ queryKey: ['event-biodiversity-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-biodiversity'] });
    }
  });
};
```

### 6. Gestion du feedback progressif

L'edge function traite les marches séquentiellement. Pour le feedback temps réel côté client, deux options :

**Option retenue** : polling léger. L'edge function met à jour un champ `summary_stats` dans `data_collection_logs` au fur et à mesure. Le client poll toutes les 2 secondes pour mettre à jour l'animation.

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/collect-event-biodiversity/index.ts` | Créer — edge function communautaire |
| `supabase/functions/_shared/auth-helper.ts` | Modifier — ajouter `validateCommunityRole` |
| `src/hooks/useTriggerBiodiversityCollection.ts` | Créer — hook mutation |
| `src/components/community/BiodiversityRevealAnimation.tsx` | Créer — animation rituelle |
| `src/components/community/EventBiodiversityTab.tsx` | Modifier — bouton dans empty state |

### Ce qui ne change pas

- Aucune modification des vues existantes (Synthèse, Taxons, Carte)
- Aucune modification du `DataCollectionPanel` admin
- Aucune modification des RLS existantes
- L'admin conserve son accès complet via le panel existant

### Sécurité

- L'edge function vérifie le JWT + le rôle communautaire côté serveur (pas de vérification client-side)
- Rate limiting : refuse si un snapshot < 24h existe déjà pour cette exploration
- Utilise le service role uniquement pour l'insertion des snapshots (table non writable par anon)

