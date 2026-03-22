

# Centrer "Les sentiers vous attendent"

## Diagnostic

Le code actuel (ligne 141) a deja `text-center` sur le conteneur parent du texte. Si le texte n'apparait pas centre visuellement, c'est probablement un probleme de cache ou de rendu. Pour s'assurer du centrage, on va forcer le centrage directement sur le paragraphe.

## Modification

### `src/pages/MarchesDuVivantConnexion.tsx` (ligne 151)

Ajouter `text-center` directement sur le `<p>` contenant le texte :

```tsx
// Avant
<p className="text-emerald-200/60 text-sm mt-1">

// Apres  
<p className="text-emerald-200/60 text-sm mt-1 text-center">
```

Egalement, s'assurer que le `motion.div` conteneur (ligne 138) a `mx-auto` pour bien centrer le bloc :

```tsx
// Avant
className="w-full max-w-lg"

// Apres
className="w-full max-w-lg mx-auto"
```

