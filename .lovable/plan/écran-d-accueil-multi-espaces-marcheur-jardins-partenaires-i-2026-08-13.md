# Écran d'accueil multi-espaces : marcheur, jardins, partenaires IoT

Un compte comme `olivier@brad.ag` cumule trois natures d'accès. L'écran de bienvenue et le sélecteur d'espace n'en connaissent aujourd'hui que deux (Mon Espace, propriétés). On ajoute la troisième : les fabricants IoT dont l'utilisateur est partenaire.

## Ce que verra l'utilisateur

À la connexion, le dialogue « Bienvenue Olivier » listera trois blocs :

```text
Mon Espace Marcheur
  Vos marches, votre carnet, votre progression

Vos jardins
  Jardin Monde DEVIAT   (Prestataire)  DEVIAT
  Maison sous Blossac   (Prestataire)  POITIERS

Vos espaces partenaires
  BRAD TECHNOLOGY  (Partenaire IoT)  — sondes, poste de contrôle, carte
```

Chaque ligne garde le lien « Toujours ouvrir cet espace ». Le sélecteur en haut de page (AppSwitcher) reprend les mêmes trois sections, donc on bascule d'un jardin à un espace partenaire sans repasser par la connexion.

## L'espace partenaire

Nouvelle page générique `/partenaire-iot/:slug` (ex. `/partenaire-iot/brad-technology`), réservée aux comptes habilités sur ce fabricant (et aux admins). Trois onglets :

- **Accueil** — synthèse générique du parc du fabricant : nombre de sondes, propriétés couvertes, dernières remontées, fraîcheur des données, vitalité 48 h.
- **Poste de contrôle** — console mutualisée existante, périmètre limité au fabricant.
- **Carte des sondes** — même console, vue carte.

La page BRAD historique `/trust-in-frequence-vivant` reste inchangée (rapport de confiance + mot de passe) et pointera vers le nouvel espace partenaire pour les onglets interactifs.

Si l'utilisateur n'est pas habilité : écran verrouillé avec invitation à se connecter / demander l'habilitation, comme aujourd'hui.

## Détails techniques

1. **Base**
   - Ajouter `slug` (texte, unique) sur `iot_fournisseurs`, rempli depuis `nom` (unaccent + tirets), avec trigger de génération à l'insertion.
   - Étendre la fonction `get_user_apps_access` pour renvoyer un tableau `partenairesIot: [{ id, nom, slug, logo_url, capteurs_count }]` calculé depuis `iot_partner_users` (actif) — et tous les fabricants si l'appelant est admin.

2. **Front**
   - `src/hooks/useUserAppsAccess.ts` : typer et exposer `partenairesIot`.
   - `src/components/community/AppChoiceDialog.tsx` : troisième section « Vos espaces partenaires », cible mémorisable `partenaire-iot:<slug>`.
   - `src/components/community/AppSwitcher.tsx` : même section, et prise en charge de `currentContext` = slug fabricant.
   - `src/pages/MarchesDuVivantConnexion.tsx` : ouvrir le dialogue dès qu'il y a au moins un espace en plus de Mon Espace (propriété **ou** partenaire) ; gérer la préférence `partenaire-iot:*`.
   - Nouveau `src/pages/PartenaireIot.tsx` + route dans `App.tsx` : résout le slug, vérifie l'habilitation via `useCanOpenIotConsole`, monte `IotConsoleProvider` avec `scope.fournisseurIds` et les capacités partenaire (pas de trame de test ni de payload brut), et affiche les trois onglets.
   - Nouveau `src/components/iot/console/IotPartnerHome.tsx` : l'accueil générique (KPIs fabricant), réutilisant les hooks de `useIotTelemetry`.
   - `src/pages/TrustInFrequenceVivant.tsx` : les onglets Poste de contrôle / Carte renvoient vers `/partenaire-iot/brad-technology` (pas de duplication de code).

3. **Sécurité** — l'affichage n'est qu'un confort : les RLS `iot_partner_users` + fonctions de scoping fournisseur restent la source de vérité pour l'accès aux sondes et mesures.
