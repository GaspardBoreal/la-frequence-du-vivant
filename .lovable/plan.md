## Objectif
Ajouter un bloc de navigation sur la page `/admin` (AdminAccess) pointant vers `/admin/adhesions`, en harmonie visuelle avec les 9 blocs existants.

## Analyse du pattern existant
Tous les blocs de la grille `AdminAccess.tsx` suivent la même structure :
```text
┌─ Card (gaspard-card p-6 hover:shadow-lg transition-shadow) ─┐
│  [Icône 32px]  Titre (text-xl font-semibold)                │
│  Description (text-muted-foreground min-h-[4rem])          │
│  [Button variant="outline" w-full]                          │
└─────────────────────────────────────────────────────────────┘
```
Les sections mises en avant ajoutent : `border-2 border-{color}-500/20 bg-{color}-500/5`.

## Implémentation
1. **Fichier modifié** : `src/pages/AdminAccess.tsx`
2. **Import** : ajouter `Heart` aux imports depuis `lucide-react`
3. **Nouveau bloc** (inséré dans la grille `grid gap-6 md:grid-cols-2 lg:grid-cols-3`) :
   - **Icône** : `Heart` (cohérente avec le thème adhésion déjà utilisé dans `AdhesionAdmin.tsx`)
   - **Couleur** : `text-accent` sur l'icône, sans bordure colorée spéciale (comme les blocs standard : Marches, Explorations, Automations, Exportations)
   - **Titre** : `Adhésions`
   - **Description** : "Générer les QR codes trackés, suivre les demandes d'adhésion et piloter les collèges de l'association."
   - **Bouton** : `variant="outline"` avec `Heart` icon + label "Accéder aux Adhésions"
   - **Lien** : `/admin/adhesions`

4. **Ordre d'insertion** : positionné après le bloc "CRM & Commercial" et avant "Exportations & Rapports", ou logiquement près de "Gestion des Marcheurs" / "Événements Grand Public" selon la préférence utilisateur (par défaut, en fin de grille avant Exportations pour ne pas décaler l'ordre établi).

Pas de modification de base de données, de routing ni de nouveau composant nécessaire — la route `/admin/adhesions` existe déjà.