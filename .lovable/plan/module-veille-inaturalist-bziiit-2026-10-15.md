# Module « Veille » : iNaturalist + bziiit

## 1. Navigation
- Admin → Outils : la carte « Veille iNaturalist » devient **« Veille »** (description : observations iNaturalist en retard + articles quotidiens bziiit).
- Nouvelle page `/admin/veille` avec deux sous-modules en onglets : **Veille iNaturalist** | **Veille bziiit** (onglet mémorisé dans l'adresse).
- `/admin/veille-inat` continue de fonctionner (redirige vers l'onglet iNaturalist) : aucun lien cassé.
- Veille iNaturalist = l'écran actuel, inchangé.

## 2. Veille bziiit — trois sous-onglets

### TdB (tableau de bord)
- Bandeau de chiffres : articles reçus (total / 7 j / 30 j), à valider vs publiés, score moyen, part RSS / Tavily, dernière collecte (alerte si rien reçu depuis plus de 26 h).
- Graphique des arrivées par jour (30 jours), empilé par score.
- Classements : thèmes, milieux, territoires, groupes d'espèces, sources les plus fréquents.
- « Pépites de la semaine » : 5 articles au meilleur score.

### Liste
- Recherche « contient » sur titre et contenu (sans tenir compte des accents ni des majuscules).
- Filtres en pastilles : période, score minimal, statut (à valider / publié), origine, thème, milieu, territoire, groupe d'espèces, source.
- Cartes article : titre, source, date, score, tags, extrait ; lien vers l'article d'origine.
- Actions : publier / dépublier, sélection multiple vers le panier newsletter.
- Mobile first : filtres dans un tiroir par le bas.

### Relier (le sous-onglet « ultra pertinent »)
Rapprochement automatique de chaque article avec les marches/explorations et les jardins, avec un score de pertinence expliqué (« pourquoi ce lien ») :
- **Territoire** : tag territoire de l'article ↔ région/département des marches et jardins.
- **Milieu & thème** : ex. `zone_humide`, `sol_et_jardin`, `agroecologie` ↔ type d'exploration, présence d'un diagnostic de sol, d'une haie, d'une mare.
- **Espèces** : groupes ou noms d'espèces cités dans l'article ↔ espèces réellement observées sur l'exploration ou le jardin (ex. article sur les frelons asiatiques → jardins où le frelon est observé).
- **Saison** : actualité du moment ↔ marches à venir.

Deux vues :
- **Par article** : « Cet article concerne 3 jardins et 2 explorations » + liste avec raisons.
- **Par destination** : choisir un jardin ou une exploration → ses articles les plus pertinents du mois (« la revue de presse de mon jardin »).

L'admin valide ou écarte chaque lien (mémorisé pour ne plus le reproposer).

## 3. Générer des newsletters ciblées
- **Panier de veille** : articles sélectionnés → bouton « Créer une lettre » qui ouvre le Studio Newsletter avec un brouillon prêt (blocs article : titre, résumé, lien, pourquoi ça vous concerne).
- **Lettres prêtes à l'emploi** proposées automatiquement :
  - « Revue de la semaine » (top 5 tous thèmes).
  - « Spécial sol et jardin » → propriétaires de jardins.
  - « Spécial territoire » (ex. Nouvelle-Aquitaine) → marcheurs et jardins de la région.
  - « Avant la marche » → inscrits d'une marche à venir, avec les articles liés à son milieu.
- Rédaction assistée par l'IA : chapeau éditorial dans le ton LFDV, résumés courts, objet de mail ; toujours relu avant envoi.

## 4. Automations vers les propriétaires de jardins
Règles activables une par une, avec aperçu « qui recevrait quoi » avant activation :
- **Alerte espèce** : un article parle d'une espèce observée dans un jardin (invasive, pathogène, pollinisateur) → message au propriétaire avec conseil.
- **Revue mensuelle personnalisée** : chaque jardin reçoit ses 3 articles les plus pertinents.
- **Météo & saison** : article sur sécheresse / gel / canicule dans son territoire → rappel adapté (paillage, arrosage, sol éponge).
- **Invitation marche** : article lié à un milieu proche d'une marche à venir → invitation à s'inscrire.
Garde-fous : un seul envoi par jardin et par semaine maximum, désinscription respectée, validation manuelle par défaut (passage en automatique sur choix de l'admin), journal de tout ce qui est envoyé.

## Ordre de livraison
1. Renommage + page à onglets + TdB + Liste.
2. Relier (rapprochements + validation).
3. Panier → Studio Newsletter + lettres prêtes à l'emploi.
4. Automations (aperçu, puis activation manuelle).

## Détails techniques
- Lecture de `public.news` (vérifier que l'admin y a accès en lecture/écriture ; sinon RPC SECURITY DEFINER réservées aux admins). Recherche via RPC avec `f_unaccent` + `ilike` sur title/description.
- Nouvelles tables : `news_links` (news_id, cible exploration|propriete, cible_id, score, raisons jsonb, statut proposé/validé/écarté), `news_automation_rules` et `news_automation_runs` (journal). GRANT + RLS admin.
- Rapprochement calculé par une edge function `news-match` (tags + territoires + noms d'espèces normalisés NFD vs pools d'espèces), lancée après la collecte quotidienne et à la demande.
- Brouillon newsletter : création d'une `newsletter_campaigns` en brouillon avec blocs, puis redirection vers l'éditeur existant ; audiences via l'AudiencePicker existant.
- Automations : cron quotidien, envoi via le pipeline newsletter existant (Resend), file en attente de validation par défaut.
- `src/pages/AdminVeille.tsx` (onglets), `AdminVeilleInat` réutilisé en contenu, composants `src/components/admin/veille/*`.
