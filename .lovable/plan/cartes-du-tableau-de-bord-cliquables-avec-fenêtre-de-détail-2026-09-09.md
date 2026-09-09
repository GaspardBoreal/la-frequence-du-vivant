# Cartes du tableau de bord cliquables, avec fenêtre de détail

## Objectif

Chaque carte du tableau de bord d'un jardin (les 2 cartes de biodiversité + les 8 cartes de modules) devient cliquable. Un clic ouvre une fenêtre de détail qui montre les données réelles derrière le chiffre, propose d'aller consulter ces données là où elles vivent, et se referme sur le tableau de bord exactement là où on l'avait laissé.

## Comportement

- Toutes les cartes sont cliquables, y compris celles qui affichent un état vide : la fenêtre explique alors ce que contiendrait ce module et comment le remplir.
- Ouverture : fenêtre centrée sur grand écran, panneau glissant depuis le bas sur téléphone, fermeture par la croix, par la touche Échap ou en cliquant à côté.
- À la fermeture, on revient au tableau de bord, sans rechargement et sans perte de position dans la page.
- Chaque fenêtre propose un ou deux boutons d'accès aux données associées, qui s'ouvrent dans un nouvel onglet pour que la page de synthèse reste intacte derrière.

## Contenu de chaque fenêtre

- **Le vivant recensé** — liste des marches rattachées (nom, date), répartition détaillée par règne, et les 15 premières espèces observées. Accès : section « Événements » de la fiche, et l'espace jardinier.
- **Les alliés du jardin** — toutes les fonctions écologiques avec leur nombre d'espèces (pas seulement les trois premières), explication de l'indice de fertilité, et origine des étiquettes (curateur, base partagée, reconnaissance automatique).
- **Observations** — questions renseignées et impressions sensorielles saisies, date de dernière modification, état complété ou en cours.
- **Analyse du sol** — liste des prélèvements avec leur repère et leurs valeurs clés.
- **Identification** — plantes bio-indicatrices relevées et lecture de l'indice de concordance.
- **Palette végétale** — zones composées avec leur nombre d'espèces, espèces écartées.
- **Atelier du jardin** — objets et ouvrages dessinés, avec leur type et leur date.
- **Tour de jardin** — tours listés par date, statut, carnet de terrain édité ou non.
- **Clinique du jardin** — consultations avec leur statut et leur date d'ouverture.
- **Capteurs et sondes** — sondes avec leur type, leur état actif ou non et leur dernière remontée.

Chaque fenêtre affiche un chargement propre, un message clair si la donnée est indisponible, et un texte d'invitation si le module est vide.

## Détails techniques

- Nouveau composant `src/components/admin/proprietes/fiche/ProprieteModuleDialog.tsx` : `Dialog` shadcn, contenu piloté par une clé de module, en-tête reprenant l'icône/accent de la carte, corps en `ScrollArea`, pied avec les liens d'accès.
- Nouveau hook `src/hooks/propriete/useProprieteModuleDetail.ts` : une requête par module, activée seulement à l'ouverture (`enabled: !!moduleKey`), réutilisant les mêmes tables que `useProprieteDashboard` mais avec les colonnes de détail (`samples`, `observed_plants`, `zones`, `propriete_objets`, `propriete_tours`, `propriete_consultations`, `iot_capteurs`).
- Le détail biodiversité réutilise `usePropertyBiodiversityKpis` déjà monté ; le hook expose en plus la liste d'espèces et les noms/dates des événements liés (via `propriete_marche_events → marche_events`), sans nouvelle migration.
- `ProprieteDashboard.tsx` et `ProprieteBiodiversityCards.tsx` : cartes converties en `<button type="button">` accessibles (focus visible, `aria-haspopup="dialog"`), état `openModule` remonté dans `ProprieteDashboard`.
- Navigation : liens internes via ancre (`#sec-evenements`) pour la fiche admin, et `/propriete/:slug` en nouvel onglet pour l'espace jardinier. `ProprieteEspace` lit un paramètre `?tab=` au montage pour ouvrir directement le bon onglet (observe, analyze, identify, palette, tour, clinique, capteurs) ; à défaut, comportement actuel inchangé.
- Aucune modification de base de données, aucune URL publique modifiée, tout reste en lecture seule côté admin.
