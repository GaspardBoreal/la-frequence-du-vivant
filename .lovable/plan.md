# Test de la chaîne Brad — résultat du 11/08 23 h 17

## Ce que je constate côté serveur

Sept livraisons Brad sont arrivées entre 23 h 13 et 23 h 16 (heure de Paris) :

| Heure | Sonde | Signature | Mesures écrites | Contenu `measures` |
| --- | --- | --- | --- | --- |
| 23:13 / 23:14 | `test-probe-001` | valide | 0 | 6 mesures (temp, humidité, sol, lux, pression, UV) — sonde fictive **inconnue** de notre base |
| 23:13 → 23:16 | `b26s001`, `b26s002`, `b26s003` | valide | 0 | **objet vide `{}`** |

Deux enseignements nets :

1. **La liaison est établie.** URL correcte, clé HMAC concordante (signature validée à chaque trame), numéros de série reconnus, journalisation et déduplication opérationnelles. Le bug de leur interface est corrigé.
2. **Brad n'envoie aucune donnée physique pour les vraies sondes.** Le bloc `measures` est vide, et `batteryPercentage` vaut 0 — leur passerelle émet une trame de notification sans les relevés. Seule leur sonde de démonstration `test-probe-001` (absente de notre parc) porte des valeurs.

## Ce qu'il faut demander à Brad

Un point précis, avec les identifiants de livraison à l'appui :

- pourquoi le champ `measures` est vide pour `b26s001`, `b26s002` et `b26s003` alors que le mode de transmission est réglé sur **Total (full)** ;
- vérifier que ces trois sondes sont bien rattachées à la parcelle émettrice (leur trame mentionne `plot: Potager d'Été`) et qu'elles ont un relevé récent côté Brad ;
- confirmer que le mode « Total (full) » embarque bien les relevés dans la même requête, et non un simple événement à aller chercher ensuite via leur API.

Éléments à leur transmettre : `delivery_id` `20ca2969-…`, `0ed89d7d-…`, `08f0e954-…` — signature validée, corps reçu avec `"measures": {}`.

## Ce que je peux faire côté application, si vous voulez

1. **Rendre visible ce cas précis** dans le Poste de contrôle : aujourd'hui une trame vide s'affiche comme « acceptée, 0 mesure », ce qui prête à confusion. J'ajouterais un état distinct « reçue sans relevé » (pastille ambre) et un compteur dédié sur 24 h.
2. **Tolérer une variante de format** au cas où Brad renverrait les relevés sous un autre nom (`data`, `readings`, tableau plutôt qu'objet) : le webhook accepterait ces formes en plus de l'actuelle, sans rien casser.
3. **Ne rien toucher** et attendre leur correctif — la chaîne est prête, c'est bien chez eux que la donnée manque.

## Détail technique

Aucun défaut détecté dans `supabase/functions/iot-webhook-brad/index.ts` : la vérification HMAC, la résolution du capteur par numéro de série, la normalisation SI et l'upsert dédupliqué fonctionnent (démontré par la trame de test interne du 11/08 16 h 22 qui a écrit 6 mesures). Le point 1 ci-dessus touche `TelemetryControl.tsx` et `useIotTelemetry.ts` ; le point 2 touche uniquement la lecture du bloc `measures` dans le webhook.
