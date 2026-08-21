# Poste de contrôle → Alertes : réparer l'analyse qui ne rend rien

## Ce qui se passe vraiment

L'accueil a raison : la Sonde Potager d'Hiver (b26s001) transmet bien 1 % d'humidité à 5 cm alors qu'elle lit 25–30 % à 30 cm. Les données arrivent, et les requêtes du poste de contrôle les récupèrent correctement (vérifié sur les appels réseau réels : toutes en 200, plusieurs milliers de relevés).

Le problème est en aval, dans le moteur d'analyse : **il plante avant de rendre son verdict**. Reproduit en local sur les valeurs exactes de la sonde :

```text
TypeError: undefined is not an object (evaluating 'serie[pire].valeur')
  anomalies.ts:376  (règle « Hors plage d'usage »)
```

La cause est une recherche d'index fausse : la règle calcule la « pire » valeur en cherchant un score transformé (écart au centre de la plage, valeur absolue) dans le tableau des valeurs brutes. Ce score n'existe presque jamais tel quel dans ce tableau, la recherche renvoie -1, et le code lit une ligne inexistante. La même erreur est présente dans la règle « Hors domaine physique ».

Conséquence en cascade : l'analyse entière échoue, le panneau ne reçoit aucun résultat, et il affiche son état vide — « Aucune valeur suspecte… 0 relevés contrôlés » — quelle que soit la période. Rien n'était donc contrôlé du tout.

## Correction

1. **Réparer la désignation de la pire valeur** (règles « Hors domaine » et « Hors plage d'usage ») : choisir directement l'index du relevé qui maximise l'écart, au lieu de rechercher un score dans les valeurs brutes. Garde-fou : si l'index reste introuvable, retomber sur le premier relevé fautif plutôt que planter.

2. **Ne plus jamais faire disparaître les alertes en silence** : envelopper chaque règle de sorte qu'une règle en défaut n'annule pas les sept autres, et remonter l'échec au lieu de le taire.

3. **Rendre l'échec visible dans l'écran** : quand l'analyse n'aboutit pas, le panneau affiche « L'analyse n'a pas pu aboutir » (avec un bouton Réessayer) au lieu du message rassurant « Aucune valeur suspecte ». Distinguer aussi le cas « analyse en cours » du cas « zéro relevé sur la période ».

## Ce qu'on verra après

Sur la période courante, la Sonde Potager d'Hiver remontera deux alertes cohérentes avec l'accueil :
- **Hors plage d'usage** — 1 % à 5 cm, sous la plage 2–60 % ;
- **Incohérence entre profondeurs** — 1 % à 5 cm contre ~29 % à 30 cm au même instant, exactement le doute signalé « à vérifier » sur l'accueil.

Et le compteur affichera le vrai nombre de relevés contrôlés au lieu de 0.

## Détails techniques

- `src/lib/iot/anomalies.ts` : remplacer `idx[vals.indexOf(Math.max(...vals.map(f)))]` par une réduction sur `idx` (index du maximum du score), dans les blocs `-dom` et `-usage` ; ajouter un repli `?? idx[0]`.
- `src/lib/iot/anomalies.ts` : isoler l'évaluation par slot dans un `try/catch` qui collecte les règles en échec dans le rapport (`erreurs: string[]`) sans interrompre l'analyse.
- `src/components/iot/alerts/AlertsPanel.tsx` : exploiter `isError` / `error` de `useIotAnomalies` pour l'état d'échec + `refetch`, et différencier `isPending` de `controles === 0`.
- Aucune modification de base de données, d'ingestion ou de règle métier : les seuils restent ceux déjà partagés avec l'accueil.
