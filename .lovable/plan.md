## Plan de correction UX/UI

### Diagnostic confirmé
- Le bouton **« Déplacer ce point (Contrôle GPS) »** ouvre bien la console GPS avec le point ciblé.
- Mais la console reçoit actuellement **toutes les observations** (`annotated`) et force le scope **« Tous les points »** à l’ouverture ciblée.
- Le filtre courant de la Carte des révélations (`nom contient = Lantana`, tags, source, périmètre, règne…) n’est pas transmis à la console GPS. Résultat : le bandeau gauche repasse sur l’ensemble des points, ce qui casse la continuité de manipulation.

### Objectif UX
Quand l’utilisateur part d’une recherche filtrée comme **Lantana · 3 résultats**, la console GPS doit s’ouvrir dans un **atelier de curation contextualisé** :
- bandeau gauche conservé sur les 3 points Lantana ;
- point cliqué déjà sélectionné et déplaçable ;
- possibilité claire de passer à tous les points si nécessaire ;
- après une correction, retour possible à la Carte des révélations avec le même filtre.

### Changements à faire

1. **Créer un contexte de curation transmis à la console GPS**
   - Dans `RevealMapBlock`, au clic sur **Déplacer ce point**, construire une liste `gpsContextCandidates` basée sur l’état courant :
     - si recherche/tags actifs : `matched` ;
     - sinon : `filtered` ;
     - conserver le point cliqué même si besoin.
   - Transmettre aussi un petit résumé lisible : ex. `Filtre conservé : “lantana” · 3 observations`.

2. **Modifier `GpsControlConsole` pour supporter un mode “filtre conservé”**
   - Ajouter des props optionnelles :
     - `contextCandidates` ou `initialCandidates` ;
     - `contextLabel` ;
     - éventuellement `onBackToRevealMap`.
   - Ajouter un nouveau scope : **`context`** en plus de `suspects` et `all`.
   - À l’ouverture depuis un point filtré, démarrer sur `context`, pas sur `all`.

3. **Refondre le bandeau gauche de la console pour la manipulation en série**
   - Afficher en haut : **« Filtre conservé · Lantana · 3 observations »**.
   - Ajouter un bouton discret : **« Voir tous les points »** seulement si l’utilisateur veut sortir du contexte.
   - Garder le point cliqué sélectionné, scrollé, avec le marqueur doré **Glissez-moi** visible.
   - Ajouter une action rapide : **« Sélectionner les 3 résultats filtrés »** pour déplacer tout le lot si les 3 points correspondent à la même correction.

4. **Conserver l’expérience après chaque correction**
   - Ne pas vider la sélection de contexte après enregistrement si on est en mode `context`.
   - Recharger les données, mais rester dans le filtre Lantana pour permettre plusieurs corrections successives.
   - Fermer la console ramène à la Carte des révélations plein écran avec la recherche toujours active.

5. **Sécuriser les cas limites**
   - Si aucun filtre n’est actif, comportement actuel possible : ouverture sur le point ciblé + tous les points.
   - Si un point filtré disparaît après curation (ex. écarté), garder le contexte lisible et sélectionner le point suivant disponible.
   - Ne pas toucher aux RPC, aux tables, ni à la logique de correction GPS : uniquement UX/state côté frontend.

### Fichiers concernés
- `src/components/propriete/identify/blocks/RevealMapBlock.tsx`
- `src/components/propriete/gps/GpsControlConsole.tsx`

### Résultat attendu
Le flux devient stable : **filtrer Lantana → cliquer un point → Contrôle GPS → le bandeau gauche reste sur les 3 Lantana → déplacer/enregistrer → continuer les autres manipulations sans perdre le contexte.**