## Diagnostic

Le `MissionAssigneesPicker` utilise `<Popover>` (shadcn) qui pose son `PopoverContent` à **`z-50`**. Or :
- `DialogContent` / `DialogOverlay` (utilisé par `MissionCreateDialog`) sont à **`z-[1200]`**
- `SheetContent` / `SheetOverlay` (utilisé par `MissionDrawer`) sont à **`z-[1100]`**

Résultat : la liste « Assigner » s'ouvre **derrière** la modale/drawer, on voit le contenu en filigrane mais on ne peut pas cliquer dessus. Le même problème affecterait n'importe quel `Select`, `DropdownMenu`, `Tooltip` ouvert depuis l'intérieur d'un Dialog/Sheet (eux aussi à `z-50`).

C'est un bug global de stacking : les surfaces flottantes Radix doivent toujours passer **au-dessus** des conteneurs flottants (modale, drawer).

## Solution

Aligner tous les "popups" Radix sur une échelle z-index cohérente, **au-dessus** de Dialog (`1200`) et Sheet (`1100`) :

| Élément | Avant | Après |
|---|---|---|
| `DialogOverlay` / `DialogContent` | `z-[1200]` | `z-[1200]` (inchangé) |
| `SheetOverlay` / `SheetContent` | `z-[1100]` | `z-[1100]` (inchangé) |
| `PopoverContent` | `z-50` | **`z-[1300]`** |
| `SelectContent` | `z-50` | **`z-[1300]`** |
| `DropdownMenuContent` / `SubContent` | `z-50` | **`z-[1300]`** |
| `TooltipContent` (si existant) | `z-50` | **`z-[1300]`** |

### Fichiers modifiés (4 fichiers, 1 ligne chacun)
1. `src/components/ui/popover.tsx` — `z-50` → `z-[1300]`
2. `src/components/ui/select.tsx` — `z-50` → `z-[1300]`
3. `src/components/ui/dropdown-menu.tsx` — `z-50` → `z-[1300]` (deux occurrences : `Content` et `SubContent`)
4. `src/components/ui/tooltip.tsx` — `z-50` → `z-[1300]` (si présent)

### Pourquoi cette approche

- **Globale et durable** : corrige *tous* les cas (création, édition, futurs formulaires) sans patch ponctuel.
- **Aucune régression** : les popups étaient déjà à `z-50` donc au-dessus de tout contenu non-flottant ; on conserve cette priorité et on ajoute la priorité sur Dialog/Sheet.
- **Cohérence avec la convention Lovable** : Dialog/Sheet ont déjà été remontés à `z-[1100/1200]` ; les flyouts doivent suivre.

### Vérification
- Ouvrir « Nouvelle mission » → cliquer « Assigner » → la liste s'affiche au-dessus de la modale, sélection fonctionnelle.
- Ouvrir une mission existante (drawer) → cliquer « Assigner » → idem.
- Vérifier que les `Select` Statut/Priorité dans le dialog restent cliquables (ils le sont déjà mais on les passe aussi au-dessus par sécurité).
