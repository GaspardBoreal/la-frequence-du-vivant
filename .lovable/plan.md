# Poste de contrôle — badge d’état universel et tri maintenance

Dans l’onglet **Poste de contrôle** (`/partenaire-iot/*?tab=controle`), la section « Vitalité des sondes · 48 dernières heures » doit afficher un badge d’état de service pour chaque sonde, comme dans la liste de la **Carte des sondes**, et garantir que les sondes en maintenance restent groupées en fin de liste.

## Ce qui change

1. **Badge d’état universel**
   - Chaque ligne « Vitalité des sondes » affiche discrètement son état de service : **En service**, **En maintenance** ou **Retirée**.
   - Le badge reprend la couleur et le label de `etatMeta(capteurEtat(c))`, avec le même style visuel compact que la liste de la Carte des sondes (pillule bordée, texte 10px, fond très léger).
   - Le badge existant « En maintenance » (avec l’icône Wrench) est remplacé par ce badge générique ; on conserve le motif `etat_motif` en sous-titre ou tooltip.

2. **Tri confirmé et robuste**
   - Les sondes sont déjà triées par `service` → `maintenance` → `retire`, puis par nom alphabétique à l’intérieur de chaque groupe.
   - On s’assure que cette règle est bien appliquée à la liste de vitalité, sans régression sur les sondes retirées.

3. **Mobile first**
   - Le badge reste `shrink-0`, le nom reste `truncate`, et le sous-titre reste en une ligne pour ne pas exploser la hauteur des cartes sur petit écran.

## Fichiers concernés

- `src/components/iot/TelemetryControl.tsx` — badge d’état et tri dans la section vitalité.
- `src/lib/iot/grandeurs.ts` — source de vérité des labels/couleurs `etatMeta` / `capteurEtat` (déjà utilisé, pas de modification attendue).

## Critères d’acceptation

1. Ouvrir le Poste de contrôle : toutes les sondes affichent un badge d’état de service.
2. Les sondes **En service** apparaissent en premier, triées par nom.
3. Les sondes **En maintenance** apparaissent ensuite, triées par nom.
4. Les sondes **Retirées** apparaissent en dernier, triées par nom.
5. Le motif de maintenance reste visible quelque part (tooltip ou sous-titre).
6. Aucune modification de données, de requête ni de RLS : uniquement de la présentation.
