# Note de valorisation — versions Simple et Complète cohérentes

## Résultat attendu
- Un sélecteur **Simple / Complète** en haut de la note, avec **Simple** sélectionnée à l'ouverture.
- **Simple** conserve l'en-tête et les sections 1 et 2, sans la ligne « Mesures capteurs IoT ». Ses trois indicateurs, le total du tableau et le pourcentage sont recalculés sur les seules autres familles, en retirant les mesures IoT du total général **et** du total attribué. Le nombre de familles affiché s'ajuste aussi.
- **Complète** présente tout le contenu actuel, mesures IoT comprises, avec les indicateurs et les sections 3 et 4.
- Le bouton **Exporter en PDF** imprime directement la version sélectionnée, sans second choix de version. La date et l'heure d'édition restent très visibles dans les deux exports. L'état déplié/réduit des marcheurs reste identique à l'écran et à l'impression.
- Chaque version indique clairement son périmètre afin que ses chiffres ne soient pas confondus avec ceux de l'autre version.

## Détails techniques
- Utiliser les familles renvoyées par `get_data_asset_stats()` comme source unique : exclure `mesures_capteurs_iot` uniquement pour la version Simple, et calculer les totaux et le ratio à partir des lignes principales visibles (pas des sous-lignes « dont »), sans modifier la fonction SQL ni ses permissions.
- Remplacer le menu d'export par un sélecteur de version visible en haut et un bouton d'impression direct. Associer la visibilité des sections, le tableau, les indicateurs et le rendu imprimé au même état de sélection.
- Conserver la base du graphique des marcheurs, déjà indépendante des mesures IoT ; conserver le masquage actuel des sections juridiques en Simple.

## Vérification
- Comparer les sommes du tableau et les trois indicateurs dans les deux versions, et confirmer que le pourcentage n'excède pas 100 %.
- Vérifier les aperçus d'impression Simple et Complète, l'horodatage et le dépliage/réduction du graphique sur chaque version.
