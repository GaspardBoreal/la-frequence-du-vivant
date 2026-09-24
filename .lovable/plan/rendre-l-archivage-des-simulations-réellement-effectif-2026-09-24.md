# Rendre l'archivage des simulations réellement effectif

## Constat (vérifié)
- La simulation lancée à 19h13 (CAPDL, réseau des 4 fermes expérimentales) a bien été générée : le plan est revenu complet.
- Mais la table des simulations est **vide** : aucune question-réponse n'a été enregistrée, donc rien n'apparaît dans Admin / CRM / IA.
- Les journaux de la fonction ne montrent aucune trace d'archivage (ni succès ni erreur). Cause la plus probable : la version en ligne de la fonction n'inclut pas encore le code d'archivage, ou la clé serveur nécessaire à l'écriture est absente et l'archivage s'arrête sans rien dire.

## Ce qui sera fait
1. **Rendre l'échec visible** : si l'enregistrement ne peut pas se faire (clé absente, refus de la base), la fonction l'écrit clairement dans ses journaux au lieu de s'arrêter en silence.
2. **Redéployer la fonction** de génération et vérifier dans les journaux que l'archivage s'exécute.
3. **Filet de sécurité côté page** : si l'archivage serveur échoue, la page partenaire envoie elle-même la simulation (projet, plan, questions-réponses) via une fonction d'enregistrement sécurisée, afin qu'aucune simulation ne soit perdue.
4. **Regroupement par visite dans CRM / IA** : une simulation et ses régénérations « Pour affiner » s'affichent comme une seule ligne (avec le nombre d'échanges), le détail montrant chaque version du plan et chaque question-réponse dans l'ordre.
5. **Test de bout en bout** : lancer une simulation + une question « Pour affiner » depuis la page Chambre d'agriculture, vérifier la ligne en base, puis l'affichage et les exports dans Admin / CRM / IA.

La simulation de 19h13 ne peut pas être récupérée (rien n'a été enregistré) : il faudra la relancer une fois le correctif en place.

## Détails techniques
- `generate-partner-roadmap` : log explicite si `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` manquent ou si l'insert renvoie une erreur ; retourner `archived: true|false` dans l'événement `result`.
- Si la clé service role n'est pas disponible dans ce projet Supabase externe, demander son ajout comme secret.
- Filet client : RPC `SECURITY DEFINER` `archive_partner_simulation(payload jsonb)` (anon/authenticated, validation de taille), appelée par `PlanActionLfdv.tsx` uniquement si `archived === false`.
- `CrmIa.tsx` : grouper par `session_key` (dernière ligne = état courant), exports incluant toutes les itérations.
