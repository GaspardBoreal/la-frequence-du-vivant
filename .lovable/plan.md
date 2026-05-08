## Objectif

Permettre la mise en forme enrichie (gras, italique, souligné, listes, sauts de ligne) du **récit / description** des Pratiques emblématiques, à la fois en édition et en affichage.

## Analyse de l'existant

- Composant : `src/components/community/insights/curation/MainCuration.tsx`
- Champ actuel : `<Textarea>` simple (ligne 437-443) → `editor.description` (string)
- Affichage actuel : `<p className="whitespace-pre-line">{entry.description}</p>` (ligne 403-407)
- Stockage BDD : colonne `description` de `exploration_curations` (text)
- Composant rich text déjà disponible dans le projet : `src/components/ui/rich-text-editor.tsx` (TipTap, déjà utilisé dans MarcheTextesAdmin, ExplorationForm, etc.)
- Sanitiseur déjà disponible : `src/utils/htmlSanitizer.ts` (`sanitizeHtml`, autorise `strong`, `em`, `u`, `b`, `i`, `p`, `br`, `ul`, `ol`, `li`, etc.)

## Solution

### Copie 1 — Édition enrichie (dialog "Modifier la pratique")

Remplacer le `<Textarea>` du champ "Récit / description" par `<RichTextEditor>` :

- Toolbar minimale : **Gras**, *Italique*, <u>Souligné</u>, listes à puces, sauts de paragraphe
- `value={editor.description}` (HTML string) / `onChange={(html) => setEditor(s => ({...s, description: html}))}`
- Conserver `maxLength` indicatif (compté sur le texte brut) et placeholder
- Aucune migration BDD : la colonne `description` (text) accueille déjà du HTML

### Copie 2 — Affichage enrichi (vue carte de pratique)

Remplacer le `<p className="whitespace-pre-line">…</p>` par un bloc HTML sanitisé :

```tsx
<div
  className="text-xs text-muted-foreground prose prose-sm max-w-none
             [&_strong]:font-semibold [&_em]:italic [&_u]:underline
             [&_ul]:list-disc [&_ul]:pl-4 [&_p]:mb-1.5"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.description) }}
/>
```

- Sécurité : `sanitizeHtml` (DOMPurify) bloque `<script>`, attributs `on*`, etc.
- Rétrocompatibilité : les descriptions existantes en texte brut s'afficheront identiquement (DOMPurify laisse passer le texte simple ; les retours à la ligne `\n` seront préservés via `whitespace-pre-line` conservé en fallback class).

### Détails techniques

- Aucune migration SQL nécessaire (colonne `text` existante).
- Aucun nouveau package : TipTap déjà installé.
- Pas d'impact sur le tri (alpha / manuel) ajouté précédemment, qui s'appuie sur `title` et `display_order`.
- Pas d'impact sur la liste publique en lecture seule (même composant d'affichage).

## Fichiers modifiés

- `src/components/community/insights/curation/MainCuration.tsx` (1 import RichTextEditor + sanitizeHtml, 1 remplacement Textarea, 1 remplacement bloc d'affichage)
