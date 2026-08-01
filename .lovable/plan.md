## Constat

Dans la Console « Contextes de la propriété », le groupe **Ouvrages** ne propose aujourd'hui que des blocs tout-ou-rien :
- `ouvrage.focus` + `ouvrage.especes` — uniquement si un ouvrage est cadré depuis la carte (aucun cadrage → invisibles) ;
- `ouvrages.tous` — les 8 emplacements en bloc, sans détail ni possibilité d'en retirer un.

Impossible donc de dire « parle-moi de la Mare et du Potager, rien d'autre ».

## Proposition : le « Plateau des ouvrages »

Un bloc dédié en tête du groupe Ouvrages, pensé comme une table de montage : chaque ouvrage est une vignette sélectionnable, le poids se recalcule en direct.

```text
OUVRAGES                                  4/8 · 1.2 Ko
┌──────────────────────────────────────────────────┐
│ Tous · Aucun · Recommandés   [Détail: résumé ▸]  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│ │● Mare      │ │● Potager   │ │○ Citerne   │ ... │
│ │  38 m²·210o│ │  62 m²·240o│ │  4 m² ·90o │     │
│ └────────────┘ └────────────┘ └────────────┘     │
└──────────────────────────────────────────────────┘
```

Comportement :
- **Clic** = ajoute/retire un ouvrage ; **Maj+clic** = plage ; boutons **Tous / Aucun / Recommandés** (les ouvrages contenant des observations ou reliés à une carotte).
- **Niveau de détail** commutable pour la sélection entière : `Résumé` (nom, type, surface, note) → `Complet` (dossier sol relié, contraintes, palette retenue) → `Complet + espèces` (espèces dans le tracé/lisière). Le poids affiché change à chaque bascule : la frugalité reste lisible.
- Vignette d'un ouvrage **cadré depuis la carte** marquée d'un liseré doré : le cadrage reste prioritaire et pré-sélectionne cet ouvrage.
- Micro-jauge par vignette (octets) + total du groupe dans l'en-tête, cohérent avec l'éco-score global.

## Détails techniques

1. **Store de sélection** — étendre `proprieteChatFocus.ts` : `selectedObjetIds: string[]` et `ouvrageDetail: 'resume' | 'complet' | 'especes'`, avec `toggleObjet / setObjets / clearObjets / setOuvrageDetail`. Le cadrage carte (`setObjet`) ajoute l'ouvrage à la sélection.
2. **Provider dynamique** — dans `useProprieteChatProviders.ts`, remplacer `ouvrages.tous` par `ouvrages.selection` : payload construit depuis les ouvrages sélectionnés (via `buildOuvrageSoilDossier` + `classifyObservations` selon le niveau de détail), libellé « n ouvrages retenus », `bytes` recalculé automatiquement. Si la sélection est vide, le provider disparaît (aucun contexte ouvrage envoyé). `ouvrage.focus` / `ouvrage.especes` restent pour le cadrage carte.
3. **UI** — nouveau `src/components/propriete/chatbot/OuvragesContextPicker.tsx`, injecté dans `ContextConsole` via une nouvelle prop optionnelle `groupExtras?: Record<string, React.ReactNode>` rendue en tête du groupe correspondant (aucune régression pour les autres pages qui utilisent la console).
4. **Synchronisation** — quand la sélection change alors que `ctx.ouvrages.selection` est actif, le slice est re-poussé avec le nouveau payload pour que l'IA reçoive toujours l'état affiché.

Aucune modification de base de données ni d'edge function : tout est calculé côté client à partir des données déjà chargées.
