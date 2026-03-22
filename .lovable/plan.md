

# Redesign du bandeau CTA "Devenez Marcheur du Vivant" — page Explorer

## Probleme

Le bandeau actuel (lignes 682-701) est plat et terne : fond `bg-emerald-950/30` grisatre, pas de profondeur, pas de coherence avec l'esthetique geopoetique soignee du reste de la page.

## Solution

Remplacer le bloc par un bandeau immersif et elegant, coherent avec le style "plaquette web" de la page :

- **Fond** : gradient radial subtil emeraude-to-teal avec un overlay de texture (pseudo-element CSS ou gradient multi-couche)
- **Bordure** : trait fin emeraude lumineux en haut, pas de bordure brute
- **Icone** : remplacer l'icone Footprints isolee par un cercle decoratif avec glow (ring emeraude + ombre diffuse)
- **Typographie** : titre en `font-crimson text-3xl text-white` au lieu de `text-foreground` (qui rend gris sur ce fond)
- **Sous-texte** : `text-emerald-200/80` pour une meilleure lisibilite
- **Bouton** : style identique au CTA hero existant (gradient + box-shadow) plutot que le `bg-emerald-600` plat actuel
- **Espacement** : `py-20` pour plus de respiration

## Modification unique

### `src/pages/MarchesDuVivantExplorer.tsx` (lignes 682-701)

Remplacer la section par :

```tsx
<section className="relative py-20 px-6 overflow-hidden"
  style={{
    background: 'linear-gradient(135deg, rgba(6,78,59,0.95) 0%, rgba(13,148,136,0.85) 50%, rgba(6,78,59,0.95) 100%)'
  }}>
  {/* Cercles decoratifs subtils */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-400/5 blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/5 blur-3xl" />
  </div>
  <div className="relative max-w-2xl mx-auto text-center space-y-6">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 mx-auto">
      <Footprints className="h-8 w-8 text-emerald-300" />
    </div>
    <h2 className="font-crimson text-3xl text-white">
      Devenez Marcheur du Vivant
    </h2>
    <p className="text-emerald-200/80 max-w-lg mx-auto">
      Créez votre compte, participez à une marche et commencez votre parcours
      du premier pas jusqu'à la transmission.
    </p>
    <Link to="/marches-du-vivant/connexion"
      className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-medium rounded-full transition-all duration-300 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        boxShadow: '0 8px 32px rgba(16,185,129,0.3), 0 2px 8px rgba(16,185,129,0.2)'
      }}>
      Rejoindre la communauté
      <ChevronRight className="w-4 h-4" />
    </Link>
  </div>
</section>
```

Aucune autre modification dans la page.

