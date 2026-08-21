# Journal de livraison : deux sous-onglets « Alertes » et « Journal »

Sous la carte des filtres du Poste de contrôle, la liste des livraisons devient un contenu à deux onglets. Les filtres actuels (période, fournisseur, sonde, état, recherche) restent au-dessus et pilotent les deux vues.

## Sous-onglet « Journal »
La liste actuelle, inchangée : pastille d'état, sonde, horodatage Paris, nombre de mesures, mesures écartées, charge utile dépliable, pagination.

## Sous-onglet « Alertes »
N'affiche que ce qui est réellement anormal sur la période retenue. Si rien n'est anormal : un état vide affirmatif (« Aucune valeur suspecte sur la période — n relevés contrôlés »), et non une liste vide.

Chaque alerte est une ligne dépliable :
- **Sonde** (nom + n° de série) et **grandeur concernée** (avec profondeur si sol)
- **Période** exacte de l'anomalie (début → fin, heure de Paris)
- **Valeur bizarre** : la valeur fautive (ou la plage), avec l'unité
- **Commentaire** en français clair, non technique : ce qui est attendu, ce qui a été vu, et ce que cela signifie probablement (« Humidité de sol à 455 % — la sonde renvoie une valeur hors du domaine physique, relevé écarté des courbes »)
- **Gravité** : critique / à surveiller / information, avec une pastille de couleur
- **Bouton « Voir dans l'Observatoire »** qui ouvre la fiche de la sonde directement calée sur une fenêtre encadrant l'anomalie (± une marge), afin que la valeur soit visible sans manipulation

Tri : gravité décroissante puis date la plus récente. Compteur d'alertes affiché en pastille sur l'onglet.

## Être « intelligent » : les règles de détection

Sept familles de règles, appliquées seulement là où elles ont un sens (une règle ne se déclenche jamais sur une grandeur que le modèle de sonde ne promet pas) :

1. **Hors domaine physique** — valeur impossible pour la grandeur (humidité hors 0–100 %, température de sol hors −40/+80 °C, indice UV hors 0–20, tension batterie hors 0–6 V…). Gravité critique.
2. **Hors plage d'usage** — valeur possible mais très inhabituelle pour la saison et le site (ex. température de sol à 45 °C). Gravité « à surveiller ».
3. **Valeur aberrante statistique** — écart robuste (médiane + écart absolu médian) calculé sur la propre histoire de la sonde pour cette grandeur et cette profondeur : on ne signale que les points au-delà d'un seuil élevé, et seulement s'il y a assez d'historique. Cela évite de crier au loup sur une sonde installée hier.
4. **Saut brutal** — variation trop rapide entre deux relevés consécutifs au regard de l'inertie physique de la grandeur (le sol ne change pas de 20 % d'humidité en 10 minutes). Regroupé en un seul événement s'il se répète.
5. **Valeur figée** — la même valeur exactement répétée pendant plusieurs heures sur une grandeur censée varier : signature typique d'un capteur bloqué.
6. **Silence** — sonde en service qui cesse d'émettre alors qu'elle avait une cadence régulière (calculée sur son propre rythme, pas sur un seuil fixe). Les sondes en maintenance sont exclues.
7. **Anomalies d'ingestion** — sur la même période : signatures refusées, erreurs de traitement, capteur inconnu, et clés écartées par le webhook (`_lfdv.ignored`) regroupées par motif.

Anti-bruit, indispensable pour que la liste reste crédible :
- Les relevés déjà marqués `rejected` en base et la grandeur masquée `soil_capacitance` ne génèrent pas de doublon d'alerte : ils apparaissent au plus comme une ligne agrégée « n relevés refusés à l'entrée ».
- Les livraisons d'essai (`webhook_test`, séries de test) sont exclues par défaut.
- Points consécutifs de même nature agrégés en **un seul événement** avec son intervalle, jamais une ligne par mesure.
- Sondes en maintenance : seules les règles 1 et 7 s'appliquent, avec la mention « sonde en maintenance ».
- Plafond d'affichage par sonde, avec « + n autres occurrences » dans le dépliant.

## Rendre les règles visibles et inspirantes

Les sept règles ne restent pas cachées dans le code : elles deviennent la matière visuelle de l'onglet.

**1. La « Constellation des sept veilles » — bandeau haut de l'onglet**
Sept pastilles alignées (une par règle), chacune avec son pictogramme, son nom court et son compteur sur la période. Une pastille éteinte (fond sourd, chiffre 0) signifie « règle active, rien à signaler » — c'est déjà une information rassurante. Une pastille allumée pulse doucement et se colore selon la gravité. Cliquer sur une pastille filtre la liste sur cette règle ; re-cliquer la libère. En mobile : bande défilable horizontalement, deux lignes de 4/3 au-delà de `sm`.

**2. La fiche de règle — panneau explicatif au clic long / bouton « ? »**
Chaque pastille ouvre une fiche courte, écrite en français de terrain :
- ce que la règle cherche, en une phrase
- le seuil réellement appliqué à cette sonde et cette grandeur (valeur concrète, pas une formule)
- une **micro-illustration animée** : une sparkline schématique de 40 px qui rejoue la signature de l'anomalie (le pic qui sort des bornes, la marche d'escalier du saut brutal, la ligne plate du capteur figé, le trou de la sonde silencieuse), avec la zone normale en fond doux et le point fautif en surbrillance
- la mention de ce qui est volontairement ignoré (essais, relevés déjà refusés)

**3. La bande de contrôle — preuve que la veille tourne**
Sous la constellation, une ligne unique : « n relevés contrôlés · m sondes · période · 7 règles appliquées », avec une barre horizontale segmentée montrant la part de relevés sains (vert calme) et la part signalée (ambre/rouge). Quand tout est sain, la barre est pleine et une phrase l'accompagne : « Toutes les valeurs de la période tiennent dans leur domaine. »

**4. La signature dans chaque alerte**
Chaque ligne d'alerte dépliée montre la même sparkline, mais avec les **vraies données** de la sonde autour de l'anomalie : la fenêtre normale en gris, la bande de confort en fond, et le ou les points fautifs marqués. C'est ce petit graphe qui rend l'anomalie évidente avant même d'ouvrir l'Observatoire.

Sobriété informationnelle : pas de bannière pédagogique permanente, tout l'explicatif est à un clic. Aucune couleur en dur, uniquement les jetons du thème (`--primary`, `--destructive`, `--muted`…), lisible en clair comme en sombre.


## Détail technique
- Nouveau module `src/lib/iot/anomalies.ts` : bornes physiques et plages d'usage par grandeur, détecteurs purs (MAD, saut, plateau, cadence), regroupement en événements, typage `IotAlerte`.
- Nouveau hook `src/hooks/iot/useIotAnomalies.ts` : lit les mesures de la période (réutilise la pagination descendante existante de `useMesuresWindow` / `useMesureSeriesRange`, plafond de lecture signalé si atteint) plus les livraisons de la même période, puis applique les détecteurs. Aucune écriture, aucune migration de base.
- `src/components/iot/DeliveryJournal.tsx` : ajout du composant `Tabs` (Alertes / Journal) sous la barre de filtres ; le corps actuel devient l'onglet Journal. L'onglet actif est mémorisé dans l'URL (`?vue=alertes`) pour rester partageable, comme les filtres existants.
- Nouveaux composants sous `src/components/iot/alerts/` : `AlertsPanel.tsx` (liste, cartes empilées en mobile, tableau dense au-delà de `md`), `RuleConstellation.tsx` (les sept pastilles + filtre), `RuleCard.tsx` (fiche explicative), `AnomalySparkline.tsx` (SVG léger, schématique ou données réelles — pas de dépendance graphique supplémentaire, Recharts réservé à l'Observatoire).
- Métadonnées de règle (nom court, pictogramme, phrase d'explication, forme de la signature) déclarées une seule fois dans `src/lib/iot/anomalies.ts` et consommées par l'UI, pour que règle détectée et règle expliquée ne divergent jamais.
- `SensorObservatory.tsx` : ajout de props facultatives `initialFrom` / `initialTo` (préréglage « perso » pré-rempli) ; comportement inchangé sans ces props. Le journal monte l'observatoire comme le font déjà la carte des sondes et l'accueil partenaire.
- Respect du périmètre `IotConsoleContext` : sur une console partenaire, seules ses sondes et livraisons sont analysées ; la charge utile brute reste réservée aux capacités existantes.
- Mobile first : filtres empilés, onglets pleine largeur, lignes d'alerte en cartes.
