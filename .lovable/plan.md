# Analyse d'une photo de test de sol par l'IA de Jardin

Permettre de joindre une image (bandelette pH, bocal de sédimentation, test NPK colorimétrique, kit labo scanné, croûte de battance…) dans la conversation, et obtenir une lecture scientifique, chiffrée et explicable — au même niveau de frugalité que les contextes actuels.

## 1. Joindre une image

Dans le menu 📎 « Joindre à la conversation », une troisième entrée : **Une photo de test de sol**.

- Prise de vue directe (mobile) ou fichier (JPG/PNG/HEIC, conversion HEIC déjà en place dans le projet).
- Redimensionnement systématique côté navigateur à 1024 px de côté long, qualité 80, avant tout envoi : c'est ce qui borne le coût.
- Vignette dans la barre de contexte, retirable, avec le poids et le coût estimé affichés **avant** l'envoi (même bandeau que les contextes 📎).

## 2. Cadrer le test (déterminant pour la qualité)

Une fois l'image jointe, un mini-formulaire d'une ligne :

- **Type de test** : bandelette pH · test NPK colorimétrique · bocal de sédimentation (texture) · test à l'acide (calcaire) · test bêche / structure · rapport de labo · autre.
- **Prélèvement rattaché** (facultatif) : la carotte A→J du registre de sol, ou l'ouvrage cadré. Le résultat peut alors être comparé aux valeurs déjà saisies.

Ce cadrage transforme une question ouverte en protocole : l'IA sait quelle échelle lire, quelles bornes sont plausibles, et quoi refuser d'interpréter.

## 3. Une réponse professionnelle et explicable

L'IA répond selon une trame imposée par le prompt :

1. **Ce que je vois** — description factuelle de l'image (couleurs, strates, repères), sans interprétation.
2. **Lecture chiffrée** — valeur lue + **plage d'incertitude** (ex. « pH 6,5 ± 0,5 — lecture colorimétrique, éclairage non contrôlé ») et unité SI.
3. **Interprétation agronomique** — rattachée aux quatre curseurs existants (eau, texture, nutrition, pH) et au verdict du registre de sol.
4. **Concordance / écart** — comparaison avec le prélèvement rattaché et avec le cortège floristique de la propriété : accord, ou écart signalé avec hypothèses.
5. **Limites** — ce que la photo ne permet pas de conclure, et le geste à faire pour lever le doute (reprendre la photo à la lumière du jour, refaire à 20 cm, envoyer au labo).
6. **Ce que ça change** — irrigation, amendement, palette végétale.

Garde-fous : jamais de valeur inventée quand la photo est floue, surexposée ou hors cadre — dans ce cas l'IA demande une reprise et dit pourquoi. Toute valeur reste une estimation visuelle, jamais présentée comme une mesure de laboratoire.

## 4. Coût de chaque requête

Le coût est affiché avant envoi, dans le même bandeau que les contextes, avec les trois crans existants (Frugal / Mesuré / Copieux).

| Élément d'une requête | Poids envoyé | Tokens estimés |
| --- | --- | --- |
| Photo redimensionnée 1024 px | ~150–250 Ko | ~1 100–1 600 tokens image |
| Cadrage du test + question | < 1 Ko | ~150 tokens |
| Contexte sol (si activé) | ~2–4 Ko | ~600–1 100 tokens |
| Historique de conversation | variable | ~300–2 000 tokens |
| Réponse structurée en 6 points | — | ~600–900 tokens sortie |

Ordre de grandeur : **~2 500 à 5 000 tokens par question avec photo**, soit environ deux à trois fois une question texte avec contexte sol. Le modèle reste `google/gemini-3.6-flash`, le moins coûteux de la gamme multimodale ; aucune requête supplémentaire n'est ajoutée (une photo = une requête).

Frugalité :
- L'image est envoyée **une seule fois**, sur le message qui la porte ; les questions de suivi réutilisent la lecture déjà écrite dans la conversation, pas l'image.
- Une seule photo par message.
- Pour les partenaires IoT, la requête consomme **un crédit**, comme aujourd'hui.

## 5. Trace

La lecture peut être **enregistrée dans le registre de sol** en un clic (valeur + incertitude + date + photo), ce qui la fait entrer dans l'historique versionné et dans les impressions PDF. Sans ce clic, rien n'est écrit : le registre garde son verrou d'écriture unique.

## 6. Détails techniques

- `src/hooks/useChatImage.ts` : sélection, conversion HEIC (`heicConverter` existant), redimensionnement canvas, sortie en data URL base64 + poids mesuré via `payloadBytes`.
- `ChatBot.tsx` : entrée « photo de test de sol » dans le menu 📎, vignette + sélecteur de type de test dans la barre de contexte, coût agrégé dans le total existant.
- `useChatStream.ts` : quand une image est jointe, le message utilisateur devient un tableau de blocs `[{type:'text'},{type:'image_url',image_url:{url:'data:image/jpeg;base64,…'}}]` au lieu d'une chaîne ; le reste du flux SSE est inchangé. Les messages historiques restent en texte (l'image n'est pas renvoyée).
- `supabase/functions/propriete-chat/index.ts` : accepte le contenu multimodal, ajoute un bloc de règles « lecture d'image de test de sol » (trame en 6 points, incertitude obligatoire, refus si illisible, bornes de plausibilité par type de test), et plafonne à une image par requête.
- Enregistrement au registre : réutilise les chemins d'écriture existants (`soilWritePaths`), aucun nouveau schéma hors la colonne photo si elle manque.
- Aucun nouveau modèle, aucune nouvelle fonction edge.
