# Régions & départements normalisés sur les propriétés

Aujourd'hui, la fiche propriété (admin) laisse saisir « Département » et « Région » en texte libre. Résultat : des valeurs incohérentes en base (« Nouvelle Aquitaine », « Nouvelle-Aquitaine », « NOUVELLE-AQUITAINE », « Gironde », et 5 propriétés sans aucune valeur). Les filtres de la liste des propriétés, qui se construisent à partir des valeurs trouvées en base, héritent de ce désordre.

Les fiches marche utilisent déjà deux listes officielles partagées (18 régions, 101 départements, en majuscules). On applique les mêmes aux propriétés.

## Ce qui va changer

### 1. Fiche propriété (admin)
- « Département » et « Région » deviennent des listes déroulantes alimentées par les mêmes référentiels que les fiches marche.
- Le département proposé se filtre selon la région choisie (et inversement, choisir un département renseigne la région).
- À la saisie du code postal, département et région sont pré-remplis automatiquement (modifiable), s'ils sont vides.
- Une valeur existante non conforme reste affichée tant qu'elle n'est pas remplacée (aucune perte silencieuse).

### 2. Normalisation des données existantes
Les 9 propriétés ont toutes un code postal, donc les 9 peuvent être corrigées automatiquement :

| Propriété | CP | Département | Région |
|---|---|---|---|
| Jardin « Les Hortensias » | 64420 | PYRÉNÉES-ATLANTIQUES | NOUVELLE-AQUITAINE |
| Jardin nourricier 7Z91 | 25800 | DOUBS | BOURGOGNE-FRANCHE-COMTÉ |
| Jardin structuré 9GQN | 27220 | EURE | NORMANDIE |
| Jardin structuré 5V38 | 27220 | EURE | NORMANDIE |
| Terrasse nourricière Toulousaine | 31300 | HAUTE-GARONNE | OCCITANIE |
| Patio végétalisé ISEG | 33000 | GIRONDE | NOUVELLE-AQUITAINE |
| Le Jardin de la Roque | 24250 | DORDOGNE | NOUVELLE-AQUITAINE |
| Maison sous Blossac | 86000 | VIENNE | NOUVELLE-AQUITAINE |
| Jardin Monde DEVIAT | 16190 | CHARENTE | NOUVELLE-AQUITAINE |

Aucune reprise manuelle ne devrait rester nécessaire. Les futures propriétés créées sans code postal resteront vides jusqu'à saisie.

### 3. Liste des propriétés (filtres)
- Les menus « Région » et « Département » s'appuient sur les référentiels officiels, restreints aux valeurs réellement présentes en base (pas de 101 entrées vides à faire défiler).
- Le menu Département se restreint à la région sélectionnée.
- Le filtrage reste côté requête (`region` / `departement`), donc valable pour la vue Table et la vue Carte, combiné aux autres filtres (période, GPS, sondes…).

## Détails techniques

- Référentiels réutilisés : `src/utils/frenchRegions.ts`, `src/utils/frenchDepartments.ts`, plus `src/utils/frenchAdministrativeCodes.ts` et `src/lib/codePostalToDepartement.ts` pour la déduction CP → département → région.
- Ajout d'un petit utilitaire partagé (label département ↔ région) pour la cascade des selects et la déduction, sans dupliquer les tables existantes.
- Fichiers touchés : `src/pages/AdminProprieteFiche.tsx` (2 champs), `src/components/admin/proprietes/ProprietesFilters.tsx` (cascade + libellés), `src/pages/AdminProprietes.tsx` (facettes normalisées).
- Base : simple mise à jour de données (`UPDATE public.proprietes`) sur les colonnes `departement` / `region` — pas de changement de schéma, pas de RLS touché. Colonnes laissées en texte pour ne rien casser côté onboarding Fréquence Jardin.
