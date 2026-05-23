# Chatbot toujours au-dessus de toutes les vues

## Problème

Le chatbot (`src/components/chatbot/ChatBot.tsx`) utilise `z-50` / `z-[75]` / `z-[80]`. Les contrôles Leaflet partagés (`src/components/maps/`, `ExplorationCarteTab`) montent jusqu'à `z-[1100]`. Conséquence : sur **toutes les vues cartographiques** (Carte exploration, drawer espèce, carte admin, pages publiques `/m/:slug`, outils GPS, zones blanches), les badges et contrôles passent devant le chatbot.

## Correction (1 seul fichier)

Dans `src/components/chatbot/ChatBot.tsx`, remonter les 4 z-index au-dessus de toute couche Leaflet existante, en gardant la hiérarchie interne intacte :

| Élément | Avant | Après |
|---|---|---|
| Bouton flottant (ligne 328) | `z-50` | `z-[1200]` |
| Panneau bas-droite non-expanded (ligne 313) | `z-50` | `z-[1200]` |
| Overlay expanded (ligne 352) | `z-[75]` | `z-[1190]` |
| Panneau expanded plein écran (ligne 312) | `z-[80]` | `z-[1200]` |

Aucune autre modification : la logique reste inchangée, c'est purement une élévation de stacking.

## Pourquoi ces valeurs

- `1200 > 1100` (couche Leaflet la plus haute du projet) → chatbot toujours devant.
- On garde `1190 < 1200` pour que l'overlay reste sous le panneau expanded.
- On reste **sous** les `z-[9999]` des Toasts/Sonner pour que les notifications systèmes restent visibles au-dessus du chatbot.
- Les Sheet/Dialog shadcn utilisent `z-50` → ils passeront désormais sous le chatbot (comportement déjà voulu : quand on ouvre le chat depuis une fiche espèce, il doit être devant — c'est d'ailleurs la raison du commentaire actuel ligne 198-199 du fichier).

## Vérification (vues à inspecter après build)

1. **Vue Carte exploration** (route actuelle) : ouvrir chatbot non-expanded, vérifier qu'il masque la barre « 5 étapes / 104 espèces » et le sélecteur Géo/Sat.
2. **Drawer fiche espèce** (mini-map) : ouvrir le chat depuis la fiche → panneau expanded au-dessus de tout.
3. **Carte admin** (`marches-map-tab`) : idem.
4. **Page publique** `/m/:slug` avec carte : idem.
5. **Vues sans carte** (Marcheurs, Synthèse, Apprendre) : aucun changement visible, le chatbot reste positionné comme avant.

## Hors-scope

- Pas de refactor du système de z-index global (pas demandé, et la hiérarchie Leaflet est intentionnellement haute pour ses propres besoins).
- Pas de mémoire à mettre à jour : le changement est local et trivial.
