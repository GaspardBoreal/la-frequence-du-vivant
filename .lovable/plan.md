# Fix reconnaissance IA — erreur Pl@ntNet 400

## Ce qui se passe

Les logs de l'edge function `recognize-marcheur-photos` montrent 81× la même erreur :

```
provider error plantnet 400: "lat" is not allowed
```

L'API Pl@ntNet `/v2/identify/{project}` (v2 actuelle) **n'accepte pas** les paramètres `lat`/`lon` en query string — ils ne sont valides que sur l'ancien endpoint « survey ». Mon edge function les ajoutait dès qu'une photo avait du GPS, ce qui faisait rejeter 100 % des photos de plantes en 400. Résultat : toutes les photos sont marquées `low_confidence` sans aucune suggestion utile.

## Correctif (1 fichier)

**`supabase/functions/recognize-marcheur-photos/index.ts`**

1. Dans `plantnetIdentify(...)` : supprimer la concaténation `&lat=...&lon=...` de l'URL. On ne garde que `api-key`, `include-related-images=false`, `no-reject=false`, `lang=fr`.
2. Retirer les paramètres `lat` / `lng` de la signature (plus utilisés côté Pl@ntNet).
3. Conserver la lecture GPS au niveau `processMedia` car elle reste utilisée pour créer la `marcheur_observation` après validation.
4. Ajouter un fallback propre : si Pl@ntNet renvoie une 404 « species not found » (cas plante non reconnue), on bascule vers Gemini Vision au lieu de marquer `low_confidence` à sec.

## Vérification

1. Re-déploiement automatique de l'edge function.
2. Sur la page admin `Reconnaissance IA`, cliquer **Lancer la reconnaissance** → les compteurs `auto_validated` / `pending_curation` doivent se peupler au lieu de tout pousser en `low_confidence`.
3. Vérifier les logs : plus d'erreur `"lat" is not allowed`.
4. Ouvrir le drawer « À curer » : les 5 suggestions Pl@ntNet doivent s'afficher par photo avec leur score de confiance.

## Hors scope

- Pas de changement de schéma SQL.
- Pas de changement UI (le panneau admin est déjà en place).
- Le quota Pl@ntNet (500 req/jour en plan gratuit) reste inchangé — 81 photos consomment 81 crédits.
