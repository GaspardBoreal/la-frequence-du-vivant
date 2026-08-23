# Ponts de l'écran « Votre jardin est créé » — prompt correctif pour le projet FJ

## Diagnostic fin (vérifié dans le code FJ)

L'écran de copie 1 est `DoneScreen.tsx` du projet **Onboarding Fréquence Jardin** (projet dérivé, non modifiable ici). Trois défauts expliquent les copies 2 à 4 :

1. **Course critique** : `OnboardingFlow.openTab()` navigue vers `/propriete/:slug` puis émet l'événement `propriete:goto-tab` après un `setTimeout` de 500 ms. Si `ProprieteEspace` n'a pas encore monté son écouteur (chargement des données), l'événement est perdu → l'utilisateur reste sur le hero du Portrait (copie 2) au lieu d'arriver dans « J'analyse ».
2. **Sous-onglet inaccessible** : « Portrait · Cadastre » envoie `tab='portrait'`, mais `portraitSub` (`'galerie' | 'cadastre'`) n'est pilotable que par le menu interne `goPortrait()` — aucun événement ne permet d'ouvrir directement le Cadastre.
3. **Pas de conscience de position** : la position exacte n'existe que si l'utilisateur a accepté la géolocalisation facultative de `IdentityScreen` (`state.identity.latitude`). Le bouton « J'analyse » ignore cette information.

## Cible : comportement de chaque bouton de copie 1

| Bouton | Cible |
|---|---|
| J'analyse | position exacte saisie → `?tab=analyze` ; sinon → `?tab=portrait&sub=cadastre` + toast « Localisez d'abord votre terrain » |
| Portrait · Cadastre | `?tab=portrait&sub=cadastre` (copie 3) |
| Clinique du vivant | `?tab=clinique` |
| IA de Jardin | inchangé (chatbot sur place, fonctionne déjà) |
| Ouvrir {jardin} | inchangé (arrivée hero / Portrait · Galerie) |

## Ce que je livre

Le prompt ci-dessous, à copier-coller tel quel dans le chat du projet FJ. Il remplace le mécanisme événement + minuteur par des **paramètres d'URL additifs** (`?tab=` / `?sub=`), robustes à la course critique, sans toucher aucune URL existante.

---

```text
Corrige les ponts de l'écran « Votre jardin est créé » (DoneScreen) vers l'espace propriété.

CONTEXTE
- src/components/onboarding/screens/DoneScreen.tsx : 4 ponts (analyze, portrait, clinique, ia) + bouton principal onOpen.
- src/components/onboarding/OnboardingFlow.tsx : openTab(slug, tab) fait navigate(`/propriete/${slug}`) puis dispatch l'événement `propriete:goto-tab` après 500 ms. Si ProprieteEspace monte après, l'événement est perdu et l'utilisateur reste sur le hero (régression constatée : « J'analyse » n'ouvre pas l'onglet).
- src/pages/ProprieteEspace.tsx : tab React state ('portrait' par défaut), portraitSub ('galerie' | 'cadastre') piloté uniquement en interne par goPortrait(). handleTabChange appelle scrollToDiagnosticPersistent().

TRAVAIL DEMANDÉ

1. ProprieteEspace.tsx — deep-linking additif
   - Lire useSearchParams() au montage : `tab` ∈ {portrait, observe, analyze, identify, synthesize, palette, clinique, capteurs} et `sub` ∈ {galerie, cadastre}.
   - Initialiser `tab` et `portraitSub` depuis ces paramètres (valeurs invalides ignorées, repli sur les défauts actuels).
   - Si un `tab` est présent dans l'URL, déclencher le même scroll que handleTabChange une fois la page montée (un seul tick, pas de boucle).
   - Conserver l'écoute de `propriete:goto-tab` pour la navigation interne (ChatBot, renvois) ; accepter en plus un detail objet { tab, sub } (rétro-compatible avec la forme string).
   - Aucune URL existante ne change : les paramètres sont optionnels.

2. OnboardingFlow.tsx — openTab devient déterministe
   - Signature : openTab(slug, target?: { tab: string; sub?: 'galerie' | 'cadastre'; reason?: string }).
   - Construit l'URL `/propriete/${slug}?tab=...&sub=...` (sub omis si absent) et supprime le setTimeout + dispatch événement.
   - Si target.reason === 'position-manquante', afficher un toast : « Localisez d'abord votre terrain pour caler le diagnostic. »

3. DoneScreen / OnboardingFlow — routage conscient de la position
   - Position exacte = state.identity.latitude != null && state.identity.longitude != null (géolocalisation facultative de IdentityScreen ; à cet instant du parcours aucune parcelle n'existe encore, inutile de requêter).
   - Pont « J'analyse » : position connue → { tab: 'analyze' } ; sinon → { tab: 'portrait', sub: 'cadastre', reason: 'position-manquante' }.
   - Pont « Portrait · Cadastre » : toujours { tab: 'portrait', sub: 'cadastre' }.
   - Pont « Clinique du vivant » : { tab: 'clinique' }.
   - Pont « IA de Jardin » et bouton « Ouvrir {jardin} » : inchangés.

CONTRAINTES
- Périmètre : src/pages/ProprieteEspace.tsx, src/components/onboarding/**. Rien d'autre.
- Aucune migration, aucune écriture dans supabase/functions/**.
- Tokens sémantiques uniquement ; vérifier thème clair et sombre, largeur 375 px.

VÉRIFICATIONS
- Créer un jardin SANS géolocalisation → « J'analyse » ouvre Mon projet · Cadastre avec le toast ; « Portrait · Cadastre » ouvre le Cadastre directement.
- Créer un jardin AVEC géolocalisation → « J'analyse » ouvre l'onglet J'analyse (méthode D.S., étape 2).
- Recharger la page sur une URL avec ?tab=analyze : l'onglet s'ouvre correctement après rechargement.
- Les événements propriete:goto-tab existants (forme string) continuent de fonctionner.
```

---

Côté projet central (ici) : aucune modification — le même support `?tab=` / `?sub=` pourra être porté plus tard sur notre `ProprieteEspace.tsx` si on veut des liens profonds depuis d'autres écrans.
