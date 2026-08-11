# Import éclair — choisir à qui attribuer les prospects

Aujourd'hui la fenêtre d'import propose seulement un interrupteur « M'attribuer ces prospects ». On le remplace par un vrai choix d'attributaire, avec « Moi » en un clic et la liste des membres de l'équipe.

## Ce que voit l'utilisateur

Dans le bloc **Destination**, la ligne « M'attribuer ces prospects » devient :

```text
Attribuer à    [ Moi (Gaspard) ▾ ]
               • Personne (non attribué)
               • Moi — <prénom nom>
               • ——— Équipe ———
               • Chaque membre actif (prénom nom · fonction)
```

- Valeur par défaut : **Moi**, si le compte connecté correspond à un membre de l'équipe ; sinon **Personne**.
- Le sélecteur reste visible même sans campagne choisie (l'attribution porte sur la fiche société).
- Si l'option « Créer aussi une opportunité » est active, l'opportunité créée reçoit **le même** attributaire, pour rester cohérent avec la fiche société.
- Le récapitulatif de fin mentionne l'attributaire : « 5 importées · 5 enrôlées · attribuées à Gaspard ».

## Correction importante au passage

Le code actuel enregistre l'identifiant du compte connecté (`auth.uid`) dans le champ d'attribution, alors que ce champ pointe vers la table des **membres d'équipe** (contrainte `crm_companies.assigned_to → team_members.id`). Une importation avec « M'attribuer » cochée échouerait donc côté base. Le sélecteur corrige cela en envoyant toujours un identifiant de membre d'équipe valide.

## Détails techniques

- `src/components/crm/PasteImportDialog.tsx`
  - remplacer l'état `assignToMe: boolean` par `assigneeId: string | null` ;
  - charger la liste via `useTeamMembers()` (`activeMembers`), déjà utilisé par `OpportunityForm` et les missions ;
  - déterminer « Moi » en croisant `supabase.auth.getUser()` avec `team_members.user_id` ; pré-sélectionner ce membre à l'ouverture, sinon `null` ;
  - passer `assigned_to: assigneeId` à `useImportCompanies` (au lieu de `uid`) ;
  - si des opportunités sont créées, renseigner leur `assigned_to` avec le même `assigneeId` ;
  - `SelectContent` en `z-[1300]` comme les autres sélecteurs de la fenêtre.
- Aucune migration de base : les colonnes `assigned_to` existent déjà sur `crm_companies` et `crm_opportunities`.

## Vérification

Coller la liste des 5 SIRET, choisir un membre autre que soi, importer : les fiches créées affichent bien cet attributaire dans l'annuaire (filtre « Assigné à »), et les opportunités éventuelles portent le même nom.
