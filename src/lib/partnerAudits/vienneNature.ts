import type { PartnerAudit } from './types';
import { vienneNatureSynthesis } from './vienneNatureSynthesis';


const CONTENT = `## Audit de visibilité — La Fréquence du Vivant × Vienne Nature

Sources : Semrush (base FR), Google Search Console (propriété la-frequence-du-vivant.com), inspection directe des sites.

---

### 1. Audit SEO

**LUI — vienne-nature.fr**

| Indicateur (Semrush) | Valeur |
|---|---|
| Mots-clés organiques | ~800 |
| Trafic organique estimé | ~8 600 /mois |
| Authority Score | 30/100 |
| Domaines référents | 423 |
| Backlinks | 33 274 (dont 29 064 liens image) |

Points forts :
- Une autorité réelle (AS 30) pour une asso naturaliste départementale, adossée à un réseau institutionnel crédible : biodiversite-nouvelle-aquitaine.fr, arb-na.fr, faune-vienne.org, sauvagesdupoitou.com, grainepc.org. C'est du lien thématique de qualité, difficile à acheter.
- Des positions n°1-3 sur des requêtes grand public à très fort volume : « loir » (27 100/mo), « lérot » (18 100/mo), « papillon noms », « arbre têtard ». Preuve que leurs fiches espèces captent une audience nationale, pas seulement locale.
- Base technique saine : WordPress + Yoast, titles et meta descriptions propres, robots.txt maîtrisé, balisage schema.org présent.

Points faibles — et c'est là que l'argument de partenariat se construit :
- **Monoculture de trafic.** La page /loir-lerot/ concentre 41 % du trafic à elle seule. Retirer cette page, et la visibilité s'effondre. Aucune diversification éditoriale.
- **Trafic non qualifié pour leur mission.** Quelqu'un qui cherche « loir animal » veut savoir comment le chasser de son grenier — pas adhérer ni participer à un inventaire. Énorme trafic, conversion quasi nulle.
- **Zéro visibilité sur les requêtes d'action** : pas de positionnement sur « sortie nature Vienne », « inventaire participatif », « sciences participatives biodiversité », « animation biodiversité entreprise ». Ils captent la curiosité, pas l'engagement.
- **Aucune offre B2B référencée.** Rien pour les entreprises, les collectivités ou les agriculteurs — alors que c'est là que se trouve le financement des assos environnementales aujourd'hui (CSRD, mécénat, trames vertes).
- Profil de liens vieillissant : anchors ultra-répétitives (« vienne nature » × 20 174), très peu de contenus frais liés récemment.

**NOUS — la-frequence-du-vivant.com**

| Indicateur | Valeur |
|---|---|
| Authority Score | 2/100 |
| Domaines référents | 26 (dont la plupart parasites) |
| Trafic organique Semrush (FR) | non mesurable — sous le seuil de détection |
| GSC (4–31 juillet 2026) | 25 clics, 103 impressions, position moyenne 4,2 |

Points forts :
- **Indexation propre et confirmée** : Google indexe la home, canonical correctement sélectionnée, dernier crawl 29/07, \`page_fetch_state: SUCCESSFUL\`. Rien ne bloque techniquement.
- **CTR remarquable : 24 %** (52 % sur la home). Quand nous apparaissons, on nous clique. Le titre et la promesse fonctionnent.
- **Position moyenne 4,2** — nous sommes déjà en page 1 sur nos requêtes de marque et sur « les marches du vivant » (position 3,9).
- Architecture éditoriale supérieure à la leur : page pilier + 4 pages filles segmentées par audience (entreprises / agriculture / explorer / association), FAQ balisée, sitemap complet, \`llms.txt\` présent.
- **Positionnement sans concurrence** : personne n'occupe le croisement bioacoustique + géopoétique + donnée CSRD opposable.

Points faibles :
- **Autorité quasi nulle (AS 2)**. 26 domaines référents, dont une majorité de fermes à backlinks (analyticshaven.top, anchorurl.cloud, byteshort.xyz…) — du bruit toxique, pas des signaux. Notre seul lien légitime vient de gaspardboreal.com.
- **103 impressions/mois** = nous sommes invisibles hors requêtes de marque. Nous ne sommes pas concurrencés, nous sommes absents.
- « la marche du vivant » (singulier) est en position 12,7 avec 0 clic : la page pilier ne couvre pas encore les variantes.
- Aucun contenu de fond indexable sur les espèces, les milieux ou les protocoles. Nous produisons énormément de données terrain, mais rien n'en ressort côté SEO.

**Le diagnostic croisé, en une phrase :** il a l'autorité mais pas le contenu qui convertit ; nous avons le contenu qui convertit mais pas l'autorité. C'est une complémentarité rare — et c'est l'argument central de la négociation.

---

### 2. Audit GEO (visibilité dans les IA génératives)

Le GEO se joue sur quatre signaux : l'accessibilité aux crawlers IA, la structuration sémantique, la citabilité (données chiffrées, entités nommées, sources), et la présence dans les corpus tiers (Wikipedia, presse, bases ouvertes).

**LUI**

Forts :
- Contenu massivement crawlé et repris. Ses fiches espèces sont anciennes, stables, textuelles et liées depuis des sources institutionnelles — exactement le profil que les modèles retiennent.
- Présence forte dans les corpus tiers : faune-vienne.org, l'ARB Nouvelle-Aquitaine, l'observatoire des mammifères. Quand une IA parle de la faune de la Vienne, elle a de fortes chances de croiser leur nom.
- Balisage schema.org Article présent, robots.txt ouvert aux crawlers IA (aucun blocage GPTBot / ClaudeBot / PerplexityBot constaté).
- Entité « Vienne Nature » claire et sans homonymie.

Faibles :
- **Pas de \`llms.txt\`** (404 confirmé) — aucune carte de lecture pour les agents IA.
- Contenu descriptif mais **non citable** : peu de chiffres datés, peu de « selon l'inventaire X de 2024 ». Les IA préfèrent citer ce qui est quantifié et sourcé.
- Le site est fortement dépendant du rendu JavaScript sur la home (notre scrape a renvoyé une page vide) : les crawlers IA légers n'y voient rien.
- Aucune donnée ouverte exposée sous format machine (pas de GBIF visible, pas d'API, pas de JSON-LD Dataset). Leur savoir n'est pas réutilisable par une IA.
- Absent de tout le champ « comment agir » : une IA interrogée sur « organiser un inventaire biodiversité sur mon exploitation en Vienne » ne les proposera pas.

**NOUS**

Forts :
- **\`llms.txt\` déjà en place et bien rédigé** — hiérarchisé, avec descriptions par page. Nous sommes en avance sur 95 % des assos environnementales françaises.
- FAQ structurée en JSON-LD, entités nommées explicites (Laurent Tripied, Gaspard Boréal, association loi 1901, GBIF), vocabulaire distinctif et non ambigu (« marches techno-sensibles », « zones blanches », « bioacoustique poétique »).
- Nous produisons de la **donnée primaire connectée au GBIF** : c'est le carburant le plus citable qui soit pour une IA.
- Rien ne bloque les crawlers : robots.txt ouvert, sitemap déclaré.

Faibles :
- **Aucune ancre externe.** Les LLM pondèrent la corroboration : une affirmation présente sur un seul domaine de AS 2 n'entre pas dans une réponse. Notre \`llms.txt\` est parfait, mais personne ne le corrobore.
- Pas de fiche Wikipedia, pas de presse indexée, pas de mention dans une base institutionnelle (ARB, OFB, GRAINE, Réseau Empreintes).
- Nos compteurs publics affichent « — » (espèces tracées, observations citoyennes) : les chiffres qui feraient notre citabilité ne sont pas rendus dans le HTML.
- Le contenu riche (marches, espèces, carnets) vit derrière des routes dynamiques peu ou pas indexées — une seule page carnet apparaît dans GSC, avec 1 impression.

**Verdict GEO :** il est cité comme *source de savoir naturaliste*, jamais comme *acteur d'action*. Nous ne sommes cités nulle part, mais nous sommes le seul des deux à être techniquement prêt pour le GEO. Un partenariat le rend citable sur l'action, et nous rend corroborables sur le savoir.

---

### 3. Cinq actions clés à lui proposer

**Action 1 — Le maillage croisé de haute pertinence (gain immédiat pour les deux)**

Trois liens contextuels de son site vers le nôtre, trois du nôtre vers le sien, en ancres descriptives et non génériques. Son AS 30 vers notre AS 2 est le levier le plus rapide dont nous disposons — un seul lien depuis vienne-nature.fr vaut plus que nos 26 domaines référents actuels. En retour, il obtient des liens depuis des pages d'action fraîches et thématiquement adjacentes, ce qui rajeunit un profil de liens aujourd'hui figé.

*Argument pour lui :* « Vos fiches espèces attirent 8 600 visiteurs/mois qui repartent sans rien faire. Nous leur offrons une action concrète à faire à côté de chez eux. »

**Action 2 — Sauver le trafic « loir/lérot » en le convertissant**

Sa page /loir-lerot/ capte 41 % de son trafic avec une intention purement informationnelle. Nous lui proposons un encart en fin de page : « Observer les micromammifères près de chez vous — participez à une Marche du Vivant en Nouvelle-Aquitaine », lié à notre page Explorer. Il transforme un trafic stérile en engagement mesurable — un KPI qu'il peut présenter à ses financeurs.

*C'est l'action qui emporte la décision : elle règle son problème n°1 sans lui coûter un euro.*

**Action 3 — Une série de 4 articles croisés, un par angle non couvert**

Chacun publié sur le site le mieux placé pour le porter, avec attribution et lien réciproque :
- « Inventaire participatif en Vienne : protocole, résultats, données ouvertes » (chez lui, avec nos données GBIF)
- « Ce que le bocage de la Vienne dit du sol vivant » (chez nous, avec son expertise naturaliste) → renforce /agriculture
- « Biodiversité en entreprise : de la sensibilisation à la donnée opposable CSRD » (chez nous, avec sa caution scientifique) → renforce /entreprises
- « Marcher pour compter : bioacoustique et sciences participatives » (chez lui, co-signé Gaspard Boréal)

Ces angles ciblent des requêtes que **ni lui ni nous** n'occupons aujourd'hui — pas de cannibalisation, création nette de visibilité pour les deux.

**Action 4 — Deux marches co-organisées géolocalisées, avec page dédiée**

Une à moins de 2 h de Deviat, une à 1 h de Maison sous Blossac. Chaque marche génère une page indexable co-brandée (« Marche du Vivant × Vienne Nature — [commune] ») portant le nom des deux entités. Le SEO local sur « sortie nature [commune] », « inventaire biodiversité Vienne » est totalement libre et faiblement concurrentiel : c'est un terrain où nous pouvons ranker en quelques semaines, à deux, alors que ni l'un ni l'autre ne le peut seul de façon crédible.

**Action 5 — Le socle GEO commun : co-citation et données ouvertes**

Trois gestes techniques à faire ensemble, qui n'existent chez aucun de leurs pairs :
- Publier un \`llms.txt\` sur vienne-nature.fr (il n'en a pas), mentionnant le partenariat et nos pages.
- Ajouter le partenaire dans le \`llms.txt\` de la Fréquence, et créer sur chaque site une page « Nos partenaires » liée depuis le pied de page, en JSON-LD \`Organization\` avec \`memberOf\` / \`partner\`.
- Exposer les données conjointes en JSON-LD \`Dataset\` avec lien GBIF, dates et nombre d'observations.

Résultat : quand ChatGPT, Perplexity ou Gemini répondent à « qui fait de la science participative biodiversité en Nouvelle-Aquitaine ? », les deux noms apparaissent **ensemble et corroborés**. Aucun des deux ne peut obtenir ça seul.

---

### Les deux points que vous n'avez pas listés

**Point 6 — Le partage d'entité : faire de Vienne Nature notre caution scientifique publique**

Notre faiblesse structurelle n'est pas le trafic, c'est **la crédibilité vérifiable**. Nous vendons de la « donnée RSE opposable CSRD » à des entreprises avec un domaine d'autorité 2 et zéro validation scientifique externe. Un DRH ou un responsable RSE qui nous google trouve un site jeune et rien d'autre.

Faire figurer « protocoles validés en partenariat avec Vienne Nature, association naturaliste agréée » sur nos pages /entreprises et /agriculture change la nature de l'offre — et donc son prix. En contrepartie, il touche un canal de financement privé (mécénat, prestations entreprises) qu'il n'a aujourd'hui aucun moyen d'atteindre : il n'a pas une seule page positionnée sur le B2B. **Nous lui apportons le marché, il nous apporte la caution.** C'est le vrai deal, et il est plus vendeur que le SEO.

**Point 7 — La réciprocité des données : un observatoire partagé, actif ET défensif**

Nos marcheurs produisent en continu des observations géolocalisées et horodatées sur des territoires que ses bénévoles ne couvrent pas — les « zones blanches ». Lui possède l'antériorité et la validation taxonomique que nous n'avons pas.

Concrètement : nos observations remontent dans ses inventaires (il gagne en couverture territoriale, argument décisif pour ses subventions publiques) ; sa validation d'expert fiabilise nos données (nous gagnons en opposabilité CSRD). Publié conjointement sur GBIF sous double attribution, cela crée un **actif de visibilité qui se renforce tout seul** : chaque nouvelle marche génère de la donnée citée, donc du lien, donc de l'autorité, pour les deux.

Et le volet défensif, qu'il faut nommer : les modèles génératifs choisissent aujourd'hui, silencieusement, une poignée de sources de référence par territoire. Dans trois ans, sur « biodiversité Vienne / Nouvelle-Aquitaine », il y aura une ou deux entités citées par défaut. Le partenariat n'est pas une opération de communication, c'est **une prise de position dans le corpus** — et cette place se prend maintenant, ou pas du tout.
`;

export const vienneNatureAudit: PartnerAudit = {
  slug: 'vienne-nature',
  partnerName: 'Vienne Nature',
  partnerSite: 'https://www.vienne-nature.fr/',
  subtitle: 'Audit de visibilité croisée SEO & GEO — base de négociation du partenariat',
  dateLabel: '4 août 2026',
  sources:
    'Semrush (base FR), Google Search Console (propriété la-frequence-du-vivant.com), inspection directe des sites.',
  matchers: ['vienne nature', 'vienne-nature', 'protec nature environnement vienne'],
  content: CONTENT,
  synthesis: vienneNatureSynthesis,
};

