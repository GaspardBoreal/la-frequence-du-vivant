

# Ajout rétroactif de participants aux événements de marche

## Probleme

Certaines marches ont eu lieu avant que le système d'inscription communautaire existe. Il faut pouvoir associer manuellement un utilisateur (via son email ou son profil communautaire) à un événement passé, avec option de marquer la participation comme validée.

## Solution

Ajouter un bouton **"+ Ajouter un participant"** dans le panneau de détail d'un événement (quand on clique sur une carte). Ce bouton ouvre un sélecteur qui :

1. Charge la liste des `community_profiles` existants
2. Permet de chercher par nom/prénom/email (via `auth.users` lié au `user_id`)
3. Insère une ligne dans `marche_participations` avec `validated_at = now()` (participation rétroactive = déjà validée)

## Implementation

### Fichier modifié : `src/pages/MarcheEventsAdmin.tsx`

Dans le panneau qui s'affiche quand `selectedEventId` est défini (là où on voit déjà la liste des participants) :

- Ajouter un bouton "Ajouter un participant"
- Au clic, afficher un `Select` searchable listant les `community_profiles` (prenom + nom)
- Exclure les utilisateurs déjà inscrits à cet événement
- À la sélection, insérer dans `marche_participations` avec :
  - `user_id` = celui du profil sélectionné
  - `marche_event_id` = l'événement en cours
  - `validated_at` = `new Date().toISOString()` (considéré validé car rétroactif)
  - `validation_method` = `'admin_retroactif'`
- Invalider le cache pour rafraîchir la liste

### Requête pour charger les profils disponibles

```typescript
const { data } = await supabase
  .from('community_profiles')
  .select('user_id, prenom, nom')
  .order('nom');
```

Puis filtrer côté client pour exclure ceux déjà dans `participations`.

## Fichier concerné

| Fichier | Changement |
|---------|-----------|
| `src/pages/MarcheEventsAdmin.tsx` | Bouton + sélecteur d'ajout rétroactif dans le panneau participants |

## UX

- Le bouton est visible uniquement quand un événement est sélectionné
- Badge `admin_retroactif` affiché à côté des participations ajoutées manuellement pour les distinguer
- Toast de confirmation après ajout

