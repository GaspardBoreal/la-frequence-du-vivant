## Diagnostic confirmé

- La propriété **Jardin Monde DEVIAT** existe et est active.
- **Gaspard Boréal** existe bien avec un `user_id` valide.
- Le champ principal `proprietes.main_walker_id` pointe bien vers Gaspard.
- Mais il n'existe **aucune ligne** dans `propriete_marcheurs` pour Gaspard + Jardin Monde DEVIAT.
- Or le RPC `get_user_apps_access()` utilisé après connexion ne lit **que** `propriete_marcheurs`, pas `proprietes.main_walker_id`.

Conclusion : l'interface Admin permet de définir un **Marcheur référent principal** dans `proprietes.main_walker_id`, mais cela ne crée pas le rattachement d'accès attendu dans `propriete_marcheurs`. Donc Gaspard n'a pas accès à la propriété côté login, même si visuellement il est référent dans Admin/Propriétés.

## Plan de correction

1. **Sécuriser la donnée existante immédiatement**
   - Ajouter une migration qui synchronise les propriétés ayant déjà un `main_walker_id` vers `propriete_marcheurs`.
   - Pour Jardin Monde DEVIAT, cela créera le lien manquant pour Gaspard.
   - Le lien sera marqué `is_main = true`.

2. **Empêcher que le bug revienne**
   - Créer une fonction/trigger SQL sur `proprietes` : à chaque création ou modification de `main_walker_id`, une ligne correspondante est automatiquement créée ou mise à jour dans `propriete_marcheurs`.
   - Si on change le référent principal, l'ancien lien principal est désactivé comme principal pour éviter les incohérences.

3. **Corriger l'interface Admin/Propriétés**
   - Quand l'admin choisit un **Marcheur référent principal**, afficher clairement que cela donne aussi accès à l'espace Propriété.
   - Après sauvegarde, invalider aussi les requêtes des rattachements pour que l'interface montre le lien sans devoir recharger.

4. **Rendre la connexion robuste**
   - Ajuster `get_user_apps_access()` pour prendre en compte à la fois :
     - les accès explicites dans `propriete_marcheurs`,
     - et les propriétés où l'utilisateur est `main_walker_id`.
   - Ainsi, même si une ancienne donnée est imparfaite, le dialogue post-connexion verra bien la propriété.

5. **Vérification finale**
   - Requêter la BDD pour confirmer que Gaspard a bien un accès à Jardin Monde DEVIAT via `propriete_marcheurs`.
   - Requêter le RPC pour confirmer qu'il retourne `jardin-monde-deviat` pour l'utilisateur Gaspard.
   - Vérifier que le flux de login peut afficher le dialogue de choix dès qu'une propriété est retournée.

## Résultat attendu

Après correction, quand Gaspard Boréal se connectera via `/connexions`, il devra voir le choix entre :

- **Mon Espace Marcheur**
- **Jardin Monde DEVIAT**

et il pourra mémoriser son espace par défaut s'il le souhaite.