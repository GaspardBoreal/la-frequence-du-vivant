## Export Word - Ordre et types : ✅ RÉSOLU

Les corrections ont été appliquées :

1. ✅ `TEXT_TYPE_LABELS` complété avec `manifeste` et 10 autres types
2. ✅ Champ `ordre` ajouté à l'interface `TexteExport` 
3. ✅ Requête SQL modifiée pour récupérer `ordre` et trier par `ordre ASC`
4. ✅ Tri par `ordre` dans `groupTextesByMarcheWithDate`
5. ✅ Index "Par Lieu" respecte l'ordre naturel (plus de regroupement par type)

### Résultat
L'export "Par marche / lieu" affiche maintenant :
1. Haïku Brut (Haïkus)
2. L'algorithme du serpent (Textes libres)
3. Constitution de Dordonia (Manifestes)
4. Épilogue — Le Parlement de l'Estuaire (Textes libres)
