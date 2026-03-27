

# Header Mon Espace : tout sur une seule ligne

## Changement

Fusionner les deux lignes du header en une seule rangée flex. Supprimer le bloc "Top row" séparé.

## Layout cible

```text
[←] [GB] [Gaspard + badge + kigo] [★ 0] [⚙️]
```

## Modification

**Fichier** : `src/components/community/MonEspaceHeader.tsx`

- Supprimer le bloc `{/* Top row: back + settings */}` (le div avec `mb-2` contenant ArrowLeft et Settings)
- Intégrer `ArrowLeft` comme premier élément de la rangée profil (avant l'avatar)
- Intégrer `Settings` comme dernier élément de la rangée profil (après le compteur fréquences)
- Supprimer le `mb-2` pour récupérer l'espace vertical
- Réduire le padding vertical du container si nécessaire (`py-3` → `py-2`)

