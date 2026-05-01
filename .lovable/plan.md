## Objectif

Réorganiser la barre d'onglets de la page Exploration (`ExplorationMarcheurPage.tsx`) pour clarifier la navigation :

```text
Avant : Carte | Marches | Empreinte | Apprendre | Marcheurs | Convivialité | Messages
Après : Carte | Marcheurs ▸ (Convivialité · Profils) | Marches | Empreinte | Apprendre
```

## Changements

### 1. Barre d'onglets globale (`globalTabs`)
- **Supprimer** les entrées `convivialite` et `messages`.
- **Réordonner** : `carte`, `marcheurs`, `marches`, `biodiversite` (Empreinte), `apprendre`.
- Mettre à jour le type `GlobalTab` en conséquence.
- Retirer le handler spécial `if (tab.key === 'convivialite') setConvivialiteOpen(true)` (la convivialité devient un sous-onglet inline).
- Retirer aussi le bloc `ComingSoonPlaceholder` "Messages partagés".

### 2. Onglet "Marcheurs" : sous-onglets horizontaux
Quand `activeGlobalTab === 'marcheurs'`, afficher une barre secondaire dans le même style visuel que les sous-onglets sensoriels existants (Voir/Écouter/Lire/Écrire/Vivant) :

```text
[ ✨ Convivialité ]   [ 👥 Profils ]
```

- Nouveau state local : `const [activeMarcheursSubTab, setActiveMarcheursSubTab] = useState<'convivialite' | 'profils'>('convivialite');` (Convivialité par défaut).
- Sous-onglet **Convivialité** → rend la mosaïque Convivialité **inline** (et non plus en overlay plein écran).
- Sous-onglet **Profils** → rend `<MarcheursTab ... />` (l'actuel contenu de l'onglet Marcheurs).
- Tracker l'activité comme pour les autres sous-onglets : `trackActivity(userId, 'tab_switch', 'tab:marcheurs:convivialite' | 'tab:marcheurs:profils')`.

### 3. Convivialité inline (plus d'overlay sur cette page)
`ConvivialiteImmersiveView` est aujourd'hui un overlay plein écran (`z-[1100]`) avec FAB d'upload `z-[1110]`. Pour l'intégrer en sous-onglet :

- Extraire le **contenu** de `ConvivialiteImmersiveView` (mosaïque + FAB upload + modes réorganisation) dans un composant réutilisable, p.ex. `ConvivialiteContent.tsx` (props identiques : `explorationId`, `explorationName`, `userId`, `userRole`, `isAdmin`).
- Conserver `ConvivialiteImmersiveView` comme **wrapper overlay** qui consomme `ConvivialiteContent` (utilisé ailleurs si nécessaire — voir vérification ci-dessous).
- Dans `ExplorationMarcheurPage.tsx`, monter `<ConvivialiteContent />` directement dans le bloc `activeGlobalTab === 'marcheurs' && activeMarcheursSubTab === 'convivialite'`.
- Supprimer de cette page : le state `convivialiteOpen`, le rendu `<ConvivialiteImmersiveView />`, et la logique `aria-hidden={convivialiteOpen}` / `!convivialiteOpen &&` autour du contenu (devenue inutile puisque l'overlay disparaît).
- Vérifier qu'aucune autre page ne dépend de l'ouverture overlay depuis cette route.

### 4. UI/UX
- Réutiliser exactement la même grammaire visuelle que la barre Voir/Écouter/Lire (icônes Lucide `Sparkles` et `Users`, indicateur `motion.div` avec `layoutId="marcheurs-subtab-indicator"`, palette emerald).
- Mobile-first : la barre tient en 2 boutons `flex-1`.
- Préserver `safe-area-inset-bottom` et le scroll comportemental existant.

## Détails techniques

**Fichiers édités :**
- `src/components/community/ExplorationMarcheurPage.tsx`
  - `globalTabs` réordonné, `convivialite`/`messages` retirés du type et du tableau
  - Imports : retirer `MessageCircle` (inutilisé), `ConvivialiteImmersiveView` ; ajouter `ConvivialiteContent`
  - Nouveau state `activeMarcheursSubTab`
  - Bloc `activeGlobalTab === 'marcheurs'` : barre de sous-onglets + switch sur le contenu
  - Suppression bloc `messages` et bloc overlay convivialité

**Fichiers créés :**
- `src/components/community/exploration/convivialite/ConvivialiteContent.tsx` — extraction du contenu (mosaïque + FAB + modes admin) sans le wrapper plein écran (pas de `position: fixed`, pas de `z-[1100]`).

**Fichiers retouchés (mineur) :**
- `src/components/community/exploration/convivialite/ConvivialiteImmersiveView.tsx` — devient un mince wrapper overlay autour de `ConvivialiteContent` (à conserver si encore référencé ailleurs ; sinon à supprimer après vérification `rg ConvivialiteImmersiveView`).
- `src/components/community/exploration/convivialite/ConvivialiteUploadFAB.tsx` — réviser le `z-index` (1110 → valeur plus modeste type `z-40`) puisqu'il n'est plus dans un overlay ; doit rester au-dessus du contenu inline mais sous la barre d'onglets sticky.

## Points de vigilance

- **Gestes de scroll** : la mosaïque Convivialité doit scroller dans le flux de la page, pas en sub-scroll.
- **FAB d'upload** : conserver son ergonomie (bouton flottant en bas à droite) mais s'assurer qu'il ne masque pas la barre de tab mobile (`MonEspaceTabBar` est `fixed bottom-0 z-50`). Lui appliquer un `bottom` qui tient compte de cette barre + `env(safe-area-inset-bottom)`.
- **Mode réorganisation drag-and-drop** : déjà fonctionnel dans la mosaïque ; vérifier qu'il reste opérant en layout inline (non bloqué par overflow parent).
- **Tracking** : préserver les events `tab_switch` existants pour ne pas casser les analytics (rebaptiser `tab:convivialite` en `tab:marcheurs:convivialite`).
- **Aucune migration BDD** requise.
- **Aucune URL publique** impactée (route inchangée).

## Mémoire à mettre à jour

Mettre à jour `mem://features/mon-espace/exploration-dedicated-page-architecture` : passer de "6-tab layout" à "5-tab layout, Marcheurs avec 2 sous-onglets (Convivialité par défaut, Profils)".
