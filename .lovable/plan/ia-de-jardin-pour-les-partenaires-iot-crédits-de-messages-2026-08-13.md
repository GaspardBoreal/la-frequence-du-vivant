# IA de Jardin pour les partenaires IoT — crédits de messages

Aujourd'hui, l'IA de Jardin ouverte depuis une console de sondes exige un compte administrateur : `olivier@brad.ag` reçoit « Forbidden — accès administrateur requis ». On ouvre l'IA aux partenaires, mais sous **crédits de messages** accordés depuis la fiche du marcheur.

## 1. Le geste admin : une habilitation qui parle

Dans la fiche communauté d'un marcheur, la carte « Accès partenaire IoT » gagne, sous chaque fournisseur habilité :

- un interrupteur **IA de Jardin** (fermée par défaut) ;
- une rangée de pastilles de crédit : **5 · 10 · 50 · 100 messages** (plus « illimité » réservé aux comptes de confiance) ;
- une **jauge de consommation** du mois en cours (« 7 / 50 messages — renouvelé le 1er septembre ») avec un bouton **Recharger** qui remet le compteur à zéro immédiatement.

Le même bloc apparaît dans l'onglet « Partenaires » de `/admin/iot`, en colonne compacte, pour piloter tout le parc d'un coup d'œil.

## 2. Le vécu partenaire : le crédit se voit, jamais il ne surprend

- Le bouton « IA de Jardin » n'apparaît sur la console partenaire que si l'IA lui est ouverte.
- Le bandeau de cadrage affiche une **jauge vivante** : anneau de crédits restants, couleur qui glisse du vert au cuivre à mesure que le solde descend, et mention « 43 messages restants ce mois ».
- À 3 messages restants, un liseré doux prévient. À zéro, le champ de saisie est remplacé par une carte sobre : « Vos crédits IA du mois sont épuisés — demandez une recharge à La Fréquence du Vivant », avec un bouton de demande qui notifie l'admin.
- Chaque réponse décompte exactement un message ; une erreur réseau ou un refus ne consomme rien.

## 3. Ce que l'IA a le droit de dire au partenaire

Le partenaire reste cadré sur **ses** sondes : contextes télémétrie (santé réseau, dernières mesures, séries agrégées) sur son périmètre fournisseur, sans les données de propriété (registre de sol, vivant, ouvrages), qui appartiennent aux propriétaires. Le mode télémétrie du prompt est conservé, augmenté d'une consigne : au niveau partenaire, on parle fiabilité de chaîne de mesure et qualité de donnée, pas agronomie d'un jardin nommé.

## 4. Détails techniques

**Base**
- Colonnes sur `public.iot_partner_users` : `ai_enabled boolean default false`, `ai_quota int default 0` (0 = fermé, `-1` = illimité), `ai_used int default 0`, `ai_period_start date default date_trunc('month', now())`.
- RPC `public.consume_iot_ai_credit(_fournisseur_id uuid)` en `SECURITY DEFINER` : vérifie l'habilitation active + `ai_enabled`, remet `ai_used` à 0 si le mois a changé, refuse si le quota est atteint, incrémente sinon, et renvoie `{allowed, remaining, quota}`. Grants `authenticated` + `service_role`.
- RPC de lecture `public.get_iot_ai_credit(_fournisseur_id uuid)` pour la jauge (sans consommer).

**Edge function `propriete-chat`**
- Branche `iotAdminMode` : si l'utilisateur n'est pas admin, tenter `consume_iot_ai_credit` avec le `fournisseurId` transmis dans `pageState.filters.iotFournisseurId`. Refus → `403` « IA non activée » ou `429` « crédits épuisés » avec le solde, messages affichés tels quels dans le chat.
- Addendum de prompt « périmètre partenaire » quand la consommation vient d'un partenaire.

**Front**
- `useIotAiCredit.ts` (lecture + invalidation après réponse) et extension de `useIotPartnerAdmin.ts` (mutations `setAiQuota`, `toggleAi`, `resetUsage`).
- `IotPartnerSection.tsx` et `IotPartnersTab.tsx` : interrupteur, pastilles de quota, jauge, bouton Recharger.
- `IotConsoleContext.tsx` : `capabilities.ai` devient vrai pour un partenaire dont l'IA est ouverte (aujourd'hui admin seulement) ; `IotChatBotMount` publie `iotFournisseurId` dans `pageState.filters` et affiche l'anneau de crédits dans `IotFocusBanner`.
- Blocage de la saisie + carte « crédits épuisés » dans le montage IoT du chat, sans toucher au `ChatBot` générique.
