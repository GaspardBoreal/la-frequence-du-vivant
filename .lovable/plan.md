

# Mettre "Immersion" comme mode par defaut dans l'onglet Voir

## Probleme

Le mode par defaut est `'fiche'` (ligne 68 de `MarcheDetailModal.tsx`). De plus, le `localStorage` persiste le dernier choix, ce qui signifie que naviguer entre les marches (Suivant/Precedent) garde le mode stocke — mais si l'utilisateur n'a jamais change, il demarre en Fiche.

## Solution

**Fichier : `src/components/community/MarcheDetailModal.tsx`**

1. **Changer le fallback par defaut** (ligne 68) : remplacer `'fiche'` par `'immersion'`
2. **Forcer le reset au changement de marche** : ajouter un `useEffect` qui remet `viewMode` a `'immersion'` quand l'ID de la marche change (props du modal), pour que chaque nouvelle marche s'ouvre en mode Immersion

Cela garantit que :
- A l'ouverture initiale → Immersion
- Suivant/Precedent → Immersion
- L'utilisateur peut basculer en Fiche manuellement, mais le prochain changement de marche revient en Immersion

