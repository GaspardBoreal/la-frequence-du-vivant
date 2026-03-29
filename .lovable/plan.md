

# Basculement clair/fonce pour les Marcheurs du Vivant

## Constat actuel

- Les variables CSS `:root` et `.dark` sont identiques (theme emeraude fonce)
- La page `/explorer` simule un mode clair avec des classes inline (`bg-[#FAF8F3]`, texte sombre)
- Aucun mecanisme global de basculement n'existe -- seul le lecteur de textes a un toggle local

## Charte graphique du mode clair (d'apres COPIE 1)

- Fond : creme/papier `#FAF8F3` (45 30% 96%)
- Texte principal : encre foncee `#1a1a1a` (0 0% 10%)
- Accent : emeraude profond `#0D6B58` (165 80% 24%) pour les titres
- Bordures/separateurs : gris chaud subtil
- Cartes : blanc pur avec ombres douces
- Typographie : serif pour les titres (Crimson Text), sans-serif pour le corps

## Plan

### 1. Definir les variables CSS du mode clair dans `src/index.css`

Remplacer le `:root` actuel (qui est fonce) par de vraies valeurs claires :

```
:root (mode clair) :
  --background: 42 30% 96%     /* creme papier */
  --foreground: 0 0% 12%       /* encre sombre */
  --card: 0 0% 100%            /* blanc */
  --card-foreground: 0 0% 12%
  --primary: 165 80% 24%       /* emeraude profond */
  --primary-foreground: 0 0% 100%
  --secondary: 42 20% 92%      /* beige subtil */
  --muted: 42 15% 90%
  --accent: 165 60% 30%
  --border: 42 15% 85%
  ...
```

Le bloc `.dark` garde les valeurs emeraude foncees actuelles.

### 2. Creer un contexte global `ThemeContext` dans `src/contexts/ThemeContext.tsx`

- State : `'light' | 'dark' | 'system'`, persiste dans `localStorage`
- Applique/retire la classe `dark` sur `<html>`
- Expose `theme`, `setTheme`, `resolvedTheme`

### 3. Integrer le provider dans `src/App.tsx`

Wrapper l'app avec `<ThemeProvider>`.

### 4. Creer un bouton de bascule elegant `ThemeToggle`

Un bouton flottant discret et inspire, accessible depuis toute page de l'espace marcheur :

- Icone animee : soleil qui se transforme en lune (transition morphing via framer-motion)
- Position : dans le header de MonEspace (a cote de l'engrenage settings) et dans le header de la page Explorer
- Au clic : bascule instantanee avec micro-animation de transition (fade 200ms sur le body)

### 5. Adapter les pages cles

| Page/Composant | Adaptation |
|----------------|-----------|
| `MarchesDuVivantExplorer` | Retirer les couleurs hardcodees (`bg-[#FAF8F3]`, `text-[#1a1a1a]`), utiliser `bg-background text-foreground` |
| `MarchesDuVivantMonEspace` | Remplacer `bg-gradient-to-br from-emerald-950...` par `bg-background` (le dark mode l'appliquera automatiquement) |
| `MonEspaceHeader` | Adapter les classes pour utiliser les variables CSS |
| `MonEspaceTabBar` | Idem |
| Composants de cards/tabs | Remplacer `bg-white/5` par `bg-card`, `text-emerald-xxx` par `text-primary`, etc. |

### 6. Fichiers impactes

| Fichier | Action |
|---------|--------|
| `src/index.css` | Redefinir `:root` en clair, garder `.dark` en emeraude |
| `src/contexts/ThemeContext.tsx` | Nouveau -- contexte global |
| `src/components/community/ThemeToggle.tsx` | Nouveau -- bouton anime soleil/lune |
| `src/App.tsx` | Ajouter ThemeProvider |
| `src/pages/MarchesDuVivantExplorer.tsx` | Remplacer couleurs inline par variables |
| `src/pages/MarchesDuVivantMonEspace.tsx` | Remplacer gradient fonce par `bg-background` |
| `src/components/community/MonEspaceHeader.tsx` | Adapter classes dark/light |
| `src/components/community/MonEspaceTabBar.tsx` | Adapter classes |

## Resultat

Le marcheur dispose d'un toggle soleil/lune dans le header. Par defaut, le mode suit la preference systeme. Le clic bascule instantanement entre le theme papier-creme (inspire, poetique, lumineux) et le theme foret-emeraude (immersif, nocturne). Le choix est memorise.

