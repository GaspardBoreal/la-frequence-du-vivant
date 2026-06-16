# Plan — Statuts v2 « LA FRÉQUENCE DU VIVANT »

Génération d'un fichier `.docx` corrigé intégrant vos choix : compatibilité **mécénat / intérêt général**, **veto ciblé** des fondateurs (au lieu du 51 %), régime **Open Data / Creative Commons** pour les observations.

## Corrections apportées

### Gouvernance (refonte majeure)
- **Art. 5** — Suppression de la pondération 51 %. Les fondateurs deviennent **membres de droit du CA** (siège permanent, dispensés d'élection) mais 1 voix = 1 voix en AG.
- **Art. 8** — CA porté à **3-10 membres** (minimum légal sain), dont au moins 1 hors fondateurs. Ajout d'une **clause de cooptation** en cours de mandat.
- **Art. 11 bis (nouveau) — Droit de veto ciblé des fondateurs**, limité à 4 sujets :
  1. Modification de l'objet social,
  2. Dissolution,
  3. Cession ou licence exclusive des actifs apportés en jouissance,
  4. Transfert du siège social hors région.
  Veto exerçable collectivement par les fondateurs présents, valable tant qu'au moins un fondateur est membre.
- **Art. 9** — Ajout d'une **délégation de signature de secours** à la Vice-Présidente en cas d'empêchement.
- **Bureau** (Art. 8) — Mention explicite de Trésorier et Secrétaire (rôles cumulables en 2026 par les 2 fondateurs) pour lever l'incohérence avec Art. 11.

### Propriété intellectuelle & données (Art. 7 & 15)
- **Code, algos, œuvres artistiques (Gaspard Boréal)** : apport en jouissance → reprise par L. TRIPIED en cas de dissolution (clause maintenue).
- **Données collectées lors des marches** : publiées sous **licence Creative Commons (CC-BY-SA 4.0)** et **Open Data** dès leur collecte. **L'association en est gestionnaire**, pas propriétaire exclusive. **Aucune reprise individuelle** possible (cohérent RGPD + science participative).
- Renvoi à un **traité d'apport séparé** à annexer pour valoriser/lister précisément les actifs apportés.
- Mention **marque « LA FRÉQUENCE DU VIVANT »** : dépôt INPI au nom de l'association.

### Conformité fiscale / mécénat
- **Art. 2** — Reformulation « gestion désintéressée, fonctionnement démocratique, gestion ouverte à un cercle large de bénéficiaires » (vocabulaire BOFiP).
- **Art. 13** — Sectorisation détaillée + seuil de **franchise des activités lucratives accessoires** (78 596 € en 2026) + engagement de filialisation si dépassement durable.
- **Art. 10** — Clause sur le **plafond de rémunération des dirigeants** (¾ SMIC ou règle des 3 dirigeants rémunérés selon ressources).

### Procédures & finitions
- **Art. 6** — Procédure d'exclusion clarifiée : convocation par LRAR, **délai de 15 jours** pour présenter ses observations, **recours devant l'AG**.
- **Art. 11** — Ajout **quorum AGO** (1/4 des membres sur 1ère convocation, sans quorum sur 2e), **vote à distance / par procuration** (max 2 pouvoirs par membre), **convocation par email** acceptée.
- **Art. 12** — Ajout **quorum AGE** (1/2 sur 1ère, 1/4 sur 2e), majorité 2/3 des présents.
- **Art. 3** — Mention de la **convention réglementée SCI / Président** soumise au vote annuel de l'AG.
- **Article RGPD (nouveau, Art. 16)** — Responsable de traitement, finalités, base légale, droits des adhérents.
- Correction coquilles (« technology » → « technologie », etc.).

## Livrable

- `/mnt/documents/Statuts_LA_FREQUENCE_DU_VIVANT_v2.docx` — version finale propre, prête à signer.
- Document généré avec `docx-js` (typographie soignée : titres Arial bold, justifications, listes propres, smart quotes françaises).
- QA visuelle obligatoire : conversion PDF + inspection page par page avant remise.

## Détails techniques

- Script Node `/tmp/gen_statuts.js` utilisant `docx` (déjà compatible projet).
- Pas de modification du code applicatif ni de la base de données.
- Aucune édition de fichiers du dépôt — uniquement l'artifact dans `/mnt/documents/`.

**⚠️ Avertissement** : ce document est une base solide mais une **relecture par un avocat ou notaire** spécialisé en droit des associations reste recommandée avant signature, notamment pour le traité d'apport en jouissance.
