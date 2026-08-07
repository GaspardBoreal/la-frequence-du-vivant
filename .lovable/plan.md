# Incident « J'analyse » — perte des données de sol (Jardin Monde DEVIAT)

## Ce que j'ai constaté dans la base (vérifié)

La fiche sol de la propriété existe toujours (une seule ligne, jamais supprimée) :

- Dernière écriture : **7 août 2026, 08:01:38 UTC (10:01 Paris)**, par le compte `b821bb9c…` (gaspard.boreal), c'est-à-dire la session ouverte ce matin à 08:00 dans l'aperçu — **pas** un compte tiers.
- Les 3 prélèvements A, B, C sont là, **avec leurs coordonnées GPS**, mais **tous les champs de test ont disparu** : structure, texture, pH par carotte, vie du sol, vers de terre, descriptions.
- Les anciennes colonnes globales ont survécu : structure « grumeleuse », texture « limoneux », pH 7.7, terrain « naturel ». Ce sont aujourd'hui les seuls vestiges de la lecture.
- Il n'existe **aucune table d'historique** sur les diagnostics de sol : la version précédente n'est plus dans la base.

## Mécanisme le plus probable (à confirmer avant correction)

Six écrans différents chargent la fiche sol en même temps (J'analyse, J'identifie, Palette, Synthèse, Le Chantier, l'IA de jardin). Chacun garde **sa propre copie** des prélèvements et **ré-enregistre la totalité du tableau** 1,5 s après le moindre changement. Une copie chargée trop tôt (ou restée figée pendant que la donnée changeait ailleurs) écrase alors la version complète par sa version pauvre. Les coordonnées survivent parce qu'elles sont réécrites par la carte ; les résultats de tests, eux, sont perdus.

C'est cohérent avec ce qu'on observe, mais je le vérifie par la trace exacte avant de toucher au code : une simple consultation ne doit jamais déclencher d'écriture.

## 1 · Récupérer les données

Par ordre de chance de succès :

1. **Restauration Supabase** (seule voie qui rend la donnée exacte). Dans le Dashboard Supabase → Database → Backups : si le PITR est actif, revenir à hier soir ; sinon prendre la sauvegarde quotidienne la plus récente. On restaure **dans un projet bac à sable**, on en extrait uniquement le tableau `samples` de cette propriété, et on le réinjecte. Aucune autre donnée du site n'est touchée. Cette étape se fait depuis votre compte Supabase, je vous guide écran par écran.
2. **Vos impressions PDF** : le « Registre des prélèvements » et le cahier « J'analyse » imprimés ces dernières semaines contiennent la totalité des tests, carotte par carotte. Si vous en avez un, je ressaisis les valeurs à l'identique.
3. **Repli partiel** : à défaut, on remet au moins la lecture globale connue (naturel / grumeleuse / limoneux / pH 7.7) sur les trois carottes, en la marquant comme reconstituée.

## 2 · Que cela n'arrive plus jamais

Quatre garde-fous, du plus urgent au plus structurel :

1. **Boîte noire du sol** : une table d'historique qui archive automatiquement chaque version des prélèvements avant modification, avec l'auteur et l'heure. Toute perte future devient réparable en un clic.
2. **Verrou anti-effacement** : la base refuse une écriture qui viderait les tests de prélèvements déjà renseignés, sauf suppression explicite demandée par l'utilisateur. Une consultation ne peut plus rien détruire.
3. **Écriture par un seul écran** : seul « J'analyse » enregistre ; les cinq autres écrans passent en lecture seule sur le sol. Fin des sauvegardes concurrentes.
4. **Enregistrement par touche, pas par tableau entier** : on n'envoie plus que la carotte modifiée, jamais tout le registre — même en cas de bug, on ne peut plus perdre que le champ en cours.

Et une **restauration à portée de main** : dans « J'analyse », un menu « Versions précédentes » listant les archives datées avec aperçu et bouton « Restaurer ».

## Détails techniques

- Table `public.propriete_soil_diagnostics`, ligne `cc23477d-…`, propriété `664670f9-…`.
- Nouvelle table `propriete_soil_history` (propriete_id, samples jsonb, colonnes globales, changed_by, changed_at) alimentée par un trigger `BEFORE UPDATE`, RLS alignée sur `can_access_propriete`, GRANT `authenticated` (select) / `service_role` (all).
- Trigger de garde : si `OLD.samples` contient des champs de test et que `NEW.samples` les perd sans que le nombre de prélèvements change, l'écriture est rejetée (contournable par un paramètre explicite `p_force`).
- `upsert_propriete_soil` : ajout d'un mode « patch d'un prélèvement » (`p_sample_patch jsonb`) fusionné côté SQL, à la place du remplacement complet.
- `usePropertySoil` : séparation lecture/écriture — un hook `usePropertySoilRead` (React Query, lecture seule) pour Identify / Palette / Synthèse / Chantier / chat, l'autosave restant exclusivement dans `TabAnalyze`. Suppression du snapshot local figé (`loadedIdRef`) au profit d'un état dérivé du cache.
- RPC `restore_propriete_soil_version(history_id)` pour le menu de restauration.
- Ordre d'exécution : (a) trace précise de l'écriture de 08:01 et confirmation du mécanisme, (b) boîte noire + verrou (migration), (c) récupération de la donnée, (d) refonte lecture/écriture, (e) menu Versions.

## À décider avec vous

- Avez-vous un PDF « Registre des prélèvements » de cette propriété ? Cela peut suffire à tout retrouver sans restauration.
- Souhaitez-vous que je vous guide dès maintenant sur la sauvegarde Supabase (je ne peux pas la déclencher à votre place) ?
