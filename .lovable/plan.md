# Transmettre une vraie liste complète des espèces à l’IA de Jardin

## Diagnostic vérifié
- **La Glycine de Chine (*Wisteria sinensis*) est bien enregistrée** dans le pool d’espèces de la marche liée à Jardin Monde DEVIAT. Ce pool contient actuellement 271 espèces.
- Le contexte nommé **« Liste complète des espèces » coupe pourtant la liste à 200 espèces**, classées par nombre d’observations. Le code inscrit alors `tronque: true` : c’est bien l’origine du message de votre capture.
- L’échange enregistré confirme que vous aviez activé ce contexte. L’assistant ne recherche pas ailleurs les espèces omises : il ne reçoit que les données attachées.
- **La limite est certaine, mais son rôle exact dans l’absence de la Glycine reste à vérifier** : son rang dans le pool brut est 95, alors que la liste transmise est reconstruite depuis les observations géolocalisées, avec un autre comptage. Les journaux disponibles ne permettent pas de lire intégralement le contenu effectivement envoyé. Il ne faut donc pas attribuer sans preuve cette omission au seul seuil de 200.

## Correction proposée
1. **Une liste complète réellement complète.** Supprimer le plafond de 200 du contexte dédié et transmettre toutes les espèces du périmètre retenu, tous règnes confondus. Conserver un format compact : noms français et scientifiques, règne, nombre d’observations, dernière date réelle. Réduire la mise en forme inutile plutôt que supprimer des espèces.
2. **Aligner l’inventaire transmis avec celui de la propriété.** Pour la propriété entière, utiliser le pool d’espèces déjà filtré par la portée géographique et la période, plutôt que reconstruire l’inventaire uniquement depuis les points de carte. Pour un ouvrage cadré, conserver les observations de son tracé et de son rayon : ne pas y injecter les espèces du reste du jardin.
3. **Afficher le nombre exact d’espèces transmises** dans le choix du contexte. Garder « Résumé du vivant » léger et distinct de la liste exhaustive ; aucune activation supplémentaire automatique.
4. **Empêcher les conclusions trompeuses.** L’assistant doit distinguer une espèce absente du contexte, hors du périmètre choisi, et réellement absente de l’inventaire complet. Un résumé ne permet jamais de conclure à une absence. Ne plus demander de replanter ou réenregistrer une espèce simplement parce qu’un extrait ne la mentionne pas. Le contexte courant doit primer sur les réponses anciennes de la conversation.

## Vérifications avant de déclarer la correction terminée
- Comparer la liste affichée et le contenu transmis pour Jardin Monde DEVIAT ; vérifier explicitement la présence de *Wisteria sinensis* et de son nom français résolu.
- Tester une liste de plus de 200 espèces, y compris une espèce placée en fin de liste : aucune perte, nombre annoncé exact.
- Vérifier qu’une espèce sans point cartographique exploitable reste dans l’inventaire de propriété lorsque le pool la conserve.
- Vérifier le respect du cadrage d’un ouvrage, du cadastre et de la période ; contrôler les résumés partiels et la résolution des noms français.
- Rejouer « Pourquoi ne mentionnes-tu pas la Glycine de Chine ? » avec le contexte corrigé et vérifier la réponse. Le parcours authentifié dans votre compte ne sera déclaré testé que si une session utilisable est disponible.

## Détails techniques
- `src/hooks/propriete/useProprieteChatProviders.ts` : génération exhaustive de `vivant.liste`, source adaptée à la portée, total exact et état d’exhaustivité explicite.
- `supabase/functions/propriete-chat/index.ts` : sérialisation compacte des contextes et règles de lecture renforcées, sans nouveau service ni accès élargi aux données.
- Ajouter des vérifications ciblées de la construction du contexte et documenter la règle d’inventaire dans `AGENTS.md`.
- Aucun changement des observations enregistrées, des droits d’accès, ni des listes publiques.