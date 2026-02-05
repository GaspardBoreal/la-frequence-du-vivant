
# Plan : Export ÉDITEUR - Format Soumission Manuscrit

## Contexte et Analyse du Retour Éditeur

Le retour de l'éditeur identifie **deux freins majeurs** :

### A) La forme "livre maquetté" vs "manuscrit inédit"
- Le PDF actuel ressemble à un livre **déjà achevé** (colophon, mentions d'éditeur, maquette sophistiquée)
- Signal perçu : "autopublication" ou "projet bouclé" → rejet automatique avant lecture
- **Solution** : Créer un format **sobre, neutre, professionnel** spécifique aux soumissions

### B) Les erreurs typographiques
- Césures malheureuses sur noms propres ("Dor-dogne", "Aci-penser stu-rio")
- Mots coupés incorrectement ("applaudisseme nts", "Écoute r")
- Espaces avant ponctuation ("cohabitation .")
- Incohérences micro-typographiques

---

## Architecture Proposée : EditorExportPanel

### Nouveau composant dédié
Un panneau d'export **séparé et spécialisé** qui génère un document Word (.docx) conforme aux attentes des comités de lecture nationaux.

### Positionnement UI
Dans `ExportationsAdmin.tsx`, ajout d'une **nouvelle carte** après les exports existants :

```
┌────────────────────────────────────────────────────────────────┐
│  📜  Export ÉDITEUR                                            │
│  ───────────────────────────────────────────────────────────   │
│  Format manuscrit sobre pour soumission aux éditeurs           │
│  de poésie nationaux (Cheyne, Gallimard, Bruno Doucey, etc.)   │
│                                                                │
│  [Configuration]  [Aperçu]  [Télécharger]                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 1. Spécifications du Format Manuscrit

### Principe directeur
> "L'éditeur doit lire le texte, pas la maquette."

### Page de titre sobre

| Élément | Format |
|---------|--------|
| Titre | Times New Roman 16pt, gras, centré |
| Sous-titre | Times 12pt, italique, centré |
| Auteur | Times 14pt, centré |
| Mention | "Manuscrit inédit" en italique |
| Contact | Email/téléphone discret en bas |

**Ce qui est retiré** :
- Mentions "Éditions...", "Achevé d'imprimer..."
- Design graphique (filets, couleurs, ornements)
- Colophon éditorial
- Logos et identité visuelle

### Typographie neutralisée

| Paramètre | Valeur |
|-----------|--------|
| Police | Times New Roman ou Georgia |
| Taille corps | 12pt |
| Interligne | 1.5 ou double |
| Marges | 2.5cm uniformes |
| Alignement | Gauche (fer à gauche) - pas justifié |
| Césure | **Désactivée complètement** |

### Corrections typographiques automatiques

Le système appliquera un **nettoyage systématique** :

1. **Suppression des césures** : Aucun mot coupé
2. **Espaces avant ponctuation** : Correction automatique (` .` → `.`)
3. **Espaces insécables** : `;`, `?`, `!`, `:` précédés d'espace fine insécable
4. **Guillemets français** : `"..."` → `« ... »`
5. **Apostrophes typographiques** : `'` → `'`
6. **Tirets** : Normalisation `-` / `–` / `—`

### Table des matières

- Format simple : Titre du texte + numéro de page
- Sans ornement, sans couleur
- Génération automatique via champs Word (TOC)

### Corps du texte

- **Pas de distinction visuelle par type** (haïku, fable, prose)
- Titre du texte en gras, taille 12pt
- Lieu/date en italique sous le titre (optionnel)
- Contenu en romain standard
- Saut de page entre chaque texte (option activable)

---

## 2. Options de Configuration

### Métadonnées éditeur

```
┌─────────────────────────────────────────────────────────────┐
│ Titre du manuscrit          [Fréquences de la rivière...]  │
│ Sous-titre (optionnel)      [Carnet de remontée poétique]  │
│ Nom de l'auteur             [Gaspard Boréal               ]│
│ Email de contact            [gpied@gaspardboreal.com      ]│
│ Téléphone (optionnel)       [                             ]│
│ ☐ Afficher les coordonnées sur la page de titre           │
└─────────────────────────────────────────────────────────────┘
```

### Contenu

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Page de titre sobre                                       │
│ ☑ Table des matières simple                                 │
│ ☐ Mentions de lieu/date sous les titres                     │
│ ☑ Saut de page entre chaque texte                          │
│ ☐ Numérotation des pages (déconseillé : Word l'ajoute)     │
│ ☐ Inclure les index (recommandé : non pour 1ère soumission)│
└─────────────────────────────────────────────────────────────┘
```

### Nettoyage typographique

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Désactiver toutes les césures                            │
│ ☑ Corriger les espaces avant ponctuation                   │
│ ☑ Normaliser les guillemets français                       │
│ ☑ Normaliser les apostrophes                               │
│ ☑ Protéger les noms propres (Dordogne, Acipenser...)       │
│ ☑ Supprimer les caractères invisibles problématiques       │
└─────────────────────────────────────────────────────────────┘
```

### Mode sélection éditeur (optionnel, Niveau 2)

Pour la recommandation "couper 15-25% des textes les plus faibles" :

```
┌─────────────────────────────────────────────────────────────┐
│ Mode sélection : ☐ Inclure tous les textes                 │
│                  ☑ Exclure certains textes manuellement    │
│                                                            │
│ [Liste des textes avec cases à cocher]                     │
│ ☐ Haïku #12 - "Silence des berges" (faible impact ?)      │
│ ☑ Fable #3 - "La trompette dans les vignes"               │
│ ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Structure des Fichiers

### Nouveaux fichiers à créer

```
src/
├── components/
│   └── admin/
│       └── EditorExportPanel.tsx    # Panneau de configuration
├── utils/
│   └── editorExportUtils.ts         # Logique de génération Word sobre
```

### Modifications mineures

| Fichier | Modification |
|---------|--------------|
| `ExportationsAdmin.tsx` | Ajout de la carte "Export ÉDITEUR" |

---

## 4. Logique de Nettoyage Typographique

### Fonction `sanitizeForEditor()`

Cette fonction sera le cœur du nettoyage :

```typescript
function sanitizeForEditor(content: string, options: EditorSanitizeOptions): string {
  let result = content;
  
  // 1. Suppression caractères invisibles problématiques
  result = removeInvisibleChars(result);
  
  // 2. Correction espaces avant ponctuation
  result = fixPunctuationSpacing(result);
  
  // 3. Normalisation guillemets
  result = normalizeQuotes(result);
  
  // 4. Normalisation apostrophes
  result = normalizeApostrophes(result);
  
  // 5. Protection noms propres (non-breaking spaces)
  result = protectProperNouns(result, PROTECTED_WORDS);
  
  // 6. Nettoyage césures résiduelles (soft hyphens, etc.)
  result = removeSoftHyphens(result);
  
  return result;
}

const PROTECTED_WORDS = [
  'Dordogne', 'Acipenser', 'sturio', 'Dordonia',
  'Gaspard', 'Boréal', 'Périgord', 'Garonne',
  // ... liste extensible
];
```

### Détection et rapport

Avant export, affichage d'un **rapport de pré-vol** :

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 3 espaces avant ponctuation corrigés                     │
│ ✓ 12 guillemets normalisés                                  │
│ ✓ 2 caractères invisibles supprimés (ZWSP)                 │
│ ⚠ 1 césure détectée dans un titre (vérifier manuellement)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Workflow d'Export

### Étapes utilisateur

1. **Sélection des textes** (via les filtres existants)
2. **Configuration** (métadonnées, options)
3. **Pré-visualisation** du rapport de nettoyage
4. **Génération** du fichier .docx
5. **Téléchargement**

### Nom du fichier généré

Format : `MANUSCRIT_[Titre]_[Date].docx`
Exemple : `MANUSCRIT_Frequences_Dordogne_2026-02-05.docx`

---

## 6. Éléments Visuels de l'Interface

### Badge distinctif

L'Export ÉDITEUR aura un badge visuel différent des autres exports :

```
┌────────────────────────────────────────────────────────────┐
│  📜  Export ÉDITEUR                    🏷️ RECOMMANDÉ      │
│  ───────────────────────────────────────────────────────   │
│  Format manuscrit conforme aux exigences des comités       │
│  de lecture : sobre, nettoyé, sans maquette.               │
│                                                            │
│  Éditeurs cibles : Cheyne, Gallimard, Bruno Doucey,       │
│  Le Castor Astral, Lanskine, Tarabuste, Wildproject       │
└────────────────────────────────────────────────────────────┘
```

### Couleur thématique

- Fond : `bg-slate-50` (gris très clair, sobre)
- Bordure : `border-slate-300`
- Icône : `📜` ou `ScrollText` (Lucide)
- Accent : Bleu sobre `text-slate-700`

---

## 7. Plan d'Implémentation

### Phase 1 : Utilitaires de nettoyage
1. Créer `editorExportUtils.ts` avec les fonctions de sanitization
2. Implémenter `sanitizeForEditor()` et ses sous-fonctions
3. Créer la liste extensible des mots protégés

### Phase 2 : Génération Word sobre
4. Créer `generateEditorManuscript()` dans `editorExportUtils.ts`
5. Implémenter la page de titre sobre
6. Implémenter la table des matières simple
7. Implémenter le formatage neutre des textes

### Phase 3 : Interface utilisateur
8. Créer `EditorExportPanel.tsx`
9. Ajouter les options de configuration
10. Implémenter le rapport de pré-vol

### Phase 4 : Intégration
11. Ajouter la carte dans `ExportationsAdmin.tsx`
12. Connecter les filtres existants

---

## 8. Résultat Attendu

### Avant (PDF Pro actuel)
- Maquetté, design "livre achevé"
- Colophon, mentions éditeur
- Césures automatiques
- Signal : "déjà publié / autopub"

### Après (Export ÉDITEUR)
- Format manuscrit sobre (Times 12pt, interligne 1.5)
- Page de titre "Manuscrit inédit"
- Typographie corrigée automatiquement
- Aucune césure
- Signal : "texte inédit prêt à être lu"

---

## 9. Compatibilité avec les Éditeurs Cibles

| Éditeur | Format demandé | Compatibilité |
|---------|----------------|---------------|
| Cheyne | Papier uniquement | ✓ Imprimer le .docx |
| Le Castor Astral | PDF par email | ✓ Export PDF depuis Word |
| Bruno Doucey | PDF par email | ✓ Export PDF depuis Word |
| Gallimard | PDF/Word/ODT | ✓ Direct |
| Lanskine | Email | ✓ Joindre le .docx |
| Tarabuste | Papier | ✓ Imprimer |
| Wildproject | PDF + présentation | ✓ Compatible |
| La rumeur libre | Papier | ✓ Imprimer |

---

## Notes Techniques

### Dépendances
- Réutilisation de la librairie `docx` déjà installée
- Aucune nouvelle dépendance requise

### Réutilisation du code existant
- Les fonctions de parsing HTML (`parseHtmlContent`, `parseFormattedText`) de `wordExportUtils.ts` seront réutilisées
- Le système de filtres existant est conservé tel quel

### Points d'attention
- Les haïkus/senryūs gardent leur structure multiligne mais sans mise en page "artistique"
- L'option de saut de page entre textes permet de réduire la pagination si nécessaire
