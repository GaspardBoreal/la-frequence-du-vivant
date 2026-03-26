

# Integration du Detecteur de Zones Blanches dans Mon Espace

## Probleme

Le detecteur de zones blanches — fonctionnalite cle du projet — n'est accessible que depuis `/marches-du-vivant/explorer`. Les marcheurs connectes doivent quitter leur espace pour y acceder. Or c'est un outil quotidien de tous les niveaux.

## Solution

Ajouter un nouvel onglet **"Zones"** dans la tab bar de Mon Espace, disponible pour **tous les roles** (y compris `marcheur_en_devenir`). Cet onglet embarque le composant `DetecteurZonesBlanches` existant dans un ecrin adapte a l'univers Mon Espace, avec un widget d'accroche sur l'onglet Accueil.

```text
AVANT (tabs marcheur)              APRES
Accueil · Marches · Quiz           Accueil · Zones · Marches · Quiz
                                          ↑ NEW
```

## Changements

### 1. Nouvel onglet "Zones" — `src/components/community/tabs/ZonesTab.tsx`

- Carte d'introduction "frost" avec le pitch zones blanches et les multiplicateurs (x1, x2, x4)
- Embed du composant `DetecteurZonesBlanches` existant (pas de duplication)
- Adaptation des styles : le detecteur a un fond sombre qui s'integre naturellement dans l'emeraude de Mon Espace

### 2. Tab bar — `src/components/community/MonEspaceTabBar.tsx`

- Ajouter `'zones'` au type `TabKey`
- Ajouter l'entree dans `TAB_META` avec icone `Radar` (lucide)
- Inserer `'zones'` en 2e position dans **tous** les roles de `TABS_BY_ROLE` (apres accueil)

### 3. Orchestrateur — `src/pages/MarchesDuVivantMonEspace.tsx`

- Importer `ZonesTab`
- Ajouter le `case 'zones'` dans `renderTab()`

### 4. Widget d'accroche sur Accueil — `src/components/community/tabs/AccueilTab.tsx`

- Ajouter un 3e bouton d'action rapide "Zones blanches" avec icone `Radar`, couleur ambre/or (rappel du multiplicateur x4)
- Click → `onNavigate('zones')`
- Passer la grille de 2 colonnes a 3 colonnes pour les 3 boutons

## Details techniques

### ZonesTab — Structure

```tsx
const ZonesTab = () => (
  <div className="space-y-4">
    {/* Carte multiplicateurs */}
    <div className="bg-white/[0.12] backdrop-blur-lg border border-white/20 rounded-xl p-5">
      <h3>Multiplicateurs de Frequences</h3>
      <div className="grid grid-cols-3 gap-2">
        <Badge>Zone frequentee ×1</Badge>
        <Badge>Peu frequentee ×2</Badge>
        <Badge>Zone blanche ×4</Badge>
      </div>
      <p>Scannez votre territoire pour trouver les zones inexplorees</p>
    </div>
    
    {/* Detecteur existant */}
    <DetecteurZonesBlanches />
  </div>
);
```

### TABS_BY_ROLE mis a jour

```typescript
marcheur_en_devenir: ['accueil', 'zones', 'marches', 'quiz'],
marcheur: ['accueil', 'zones', 'marches', 'quiz'],
eclaireur: ['accueil', 'zones', 'marches', 'quiz', 'carnet', 'sons'],
ambassadeur: ['accueil', 'zones', 'marches', 'quiz', 'carnet', 'sons', 'kigo'],
sentinelle: ['accueil', 'zones', 'marches', 'quiz', 'carnet', 'sons', 'kigo', 'territoire'],
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/community/tabs/ZonesTab.tsx` | **Nouveau** — Onglet zones blanches |
| `src/components/community/MonEspaceTabBar.tsx` | Ajouter `zones` au type + meta + roles |
| `src/pages/MarchesDuVivantMonEspace.tsx` | Importer et router ZonesTab |
| `src/components/community/tabs/AccueilTab.tsx` | Ajouter bouton rapide "Zones blanches" |

