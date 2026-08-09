# Terminer le P0 « Fiabilité de la saisie »

Le premier chantier (audit des chemins d'écriture) est clos. Trois chantiers restent ouverts sur les quatre.

## 1. Sortie du mode édition sans piège (2 j)

Constat sur l'écran « J'analyse » : le seul moyen de sortir se trouve tout en bas, dans le bloc d'actions ; le bandeau « Mode édition » n'apparaît que lorsque l'étape a déjà été marquée terminée. Sur un long formulaire, et surtout sur mobile, l'utilisateur ne voit aucune issue.

À livrer :

- Une barre d'en-tête collante avec l'état d'enregistrement (« Enregistré à 14 h 02 » / « Enregistrement… ») et un bouton **Terminer** toujours accessible, quel que soit le défilement.
- Le même bouton **Terminer** conservé en bas, dans le bloc d'actions.
- Sortie possible à tout moment, sans blocage : aucun champ obligatoire ne retient l'utilisateur.
- À la sortie, une confirmation explicite listant ce qui a été enregistré (nombre de prélèvements, blocs renseignés, heure de la dernière écriture) plutôt qu'un simple retour silencieux.
- Bandeau « Mode édition » affiché dès l'entrée en édition, pas seulement une fois l'étape terminée.

## 2. Historique du registre mis en avant (1 j)

Le panneau d'historique existe mais reste replié et muet : il faut cliquer pour découvrir qu'il y a des versions.

À livrer :

- Ligne d'en-tête toujours visible : date et heure de la dernière version, auteur, nombre de prélèvements de cette version.
- Bouton **Restaurer** en un clic sur la dernière version, avec la confirmation existante.
- Signalement discret quand la dernière version contient moins de prélèvements que la précédente.
- Panneau visible dès l'ouverture de « J'analyse », en mode édition comme en mode synthèse.

## 3. Reproduction du scénario de perte (1 j)

Rien ne rejoue aujourd'hui le parcours qui a causé la perte. À livrer : un test rejouable avant chaque livraison.

- Test automatisé du parcours : ouverture d'un jardin, entrée en édition, saisie partielle, sortie brutale (fermeture d'onglet, retour arrière, navigation vers un autre onglet de la propriété), puis relecture du registre.
- Vérifications : aucune écriture n'est émise par les écrans en lecture seule ; aucun enregistrement vide ne part ; le registre relu contient toujours le même nombre de prélèvements et les mêmes valeurs.
- Un second test vérifie côté serveur que le garde-fou refuse bien une écriture amputée.
- Rapport lisible : ces deux tests sont aussi exposés comme « test à blanc » dans le Coffre-fort du registre, pour rejouabilité sans outillage.

## Suivi de la feuille de route

Une fois les trois chantiers livrés, les statuts passent à « Fait » sur la page partenaire et le P0 affiche 4/4 chantiers livrés, ce qui ouvre le P1 Lisibilité.

## Détails techniques

- `src/components/propriete/tabs/TabAnalyze.tsx` : nouvelle barre collante (`sticky top-0 z-30`) réutilisant `savedAt`/`saving` déjà calculés, bandeau d'édition affiché quel que soit `isDone`, dialogue de confirmation de sortie récapitulant l'état enregistré.
- Nouveau `src/components/propriete/analyze/AnalyzeStickyBar.tsx` (tokens `--ds-*` existants, micro-animation Motion à l'apparition).
- `src/components/propriete/analyze/SoilHistoryPanel.tsx` : requête de la dernière version chargée sans dépliage (`enabled: !!proprieteId`), en-tête résumé + bouton de restauration rapide ; la liste complète reste sous le dépliage.
- Tests : `src/hooks/propriete/__tests__/usePropertySoil.persist.test.ts` (aucune écriture en `readOnly`, aucune écriture avant réponse serveur, patch chirurgical du déplacement) et script Playwright `tests/e2e/soil-register-loss.spec.ts` pour le parcours navigateur.
- `src/pages/AdminSoilRegistryAudit.tsx` : le test à blanc existant est complété par un rejeu « écriture amputée refusée » déjà couvert côté serveur.
- `src/lib/partnerRoadmaps/vdtpRoadmap.ts` : statuts par défaut mis à jour ; les statuts réels restent pilotés par `partner_roadmap_task_status`.
- Aucune migration nécessaire.
