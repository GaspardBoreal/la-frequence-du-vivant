## Problème

Sur la carte des Marches du Vivant, cliquer sur « Rejoindre la Fréquence » (vignette / popup carte) d'un événement **public** (comme Château Boutinet) redirige vers `/marches-du-vivant/connexion?next=/m/...` alors que la fiche `/m/:slug` est **publique** et pensée pour la découverte grand public (immersion Vignoble incluse).

## Cause

Dans `EventCard.tsx` et `MapView.tsx`, le CTA principal des marches à venir construit l'URL comme :

```ts
const inscriptionUrl = user ? detailUrl : `/marches-du-vivant/connexion?next=…`;
```

Ce raccourci part du principe qu'il faut être connecté pour « rejoindre ». Or `/m/:slug` est publique : forcer la connexion casse le funnel d'attractivité (le visiteur ne voit jamais la fiche immersive avant de devoir créer un compte).

## Correctif proposé

Dissocier **découverte publique** et **inscription**. Le clic sur la vignette doit d'abord ouvrir la fiche publique ; l'inscription (auth requise) se fait *depuis* la fiche.

### 1. `src/components/carte-mdv/EventCard.tsx`

- Pour un événement public (`event.is_public && event.public_slug`, non-jardin), le CTA principal des marches à venir devient un lien direct vers `/m/:slug`, libellé **« Découvrir & rejoindre »** (visiteurs anonymes) ou **« S'inscrire à cette marche »** (connectés, comme aujourd'hui).
- Retirer la ligne secondaire « Déjà marcheur ? Se connecter » pour les événements publics (redondante — la fiche propose l'entrée).
- Comportement inchangé pour les événements non-publics (fallback `/admin/...`) et Jardin.

### 2. `src/components/carte-mdv/views/MapView.tsx`

- Même logique dans la popup carte : pour un événement public à venir, `ctaHref = detailUrl` (pas `inscriptionUrl`) et libellé **« Rejoindre la Fréquence »** conservé (déjà attractif).
- Le passage par `/connexion?next=…` reste uniquement pour les événements non-publics à venir (accès admin réservé).

### 3. Aucune modif backend, aucune modif de `/m/:slug`

La fiche publique (`PublicEventPage` / `VignobleImmersion`) reste inchangée : elle contient déjà son propre CTA d'inscription (« Préparer sa marche »). Si besoin d'un futur bouton « S'inscrire à cette marche » côté fiche qui déclenche la connexion, ce sera un ajout séparé.

## Résultat UX

- Anonyme clique « Rejoindre la Fréquence » sur la carte → **atterrit sur la fiche immersive Château Boutinet** (Terroir Noble, 7 actes).
- Depuis la fiche, s'il veut réserver, il utilise le CTA d'inscription qui, lui, peut demander la connexion.
- Marcheur déjà connecté : parcours inchangé (S'inscrire direct).
