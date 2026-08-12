/**
 * Relevé de conformité de la chaîne télémétrie BRAD × La Fréquence du Vivant.
 * Chiffres constatés directement en base le 12/08/2026 à 11 h (Paris),
 * sur les 72 heures précédentes. Page publique protégée : /trust-in-frequence-vivant
 */

export const TRUST_PASSWORD = 'WINWINBRAD-LFDV';

export const TRUST_REPORT = {
  releveLabel: '12 août 2026 · 11 h (Paris)',
  fenetre: '72 dernières heures',
  livraisonsValides: 330,
  livraisonsRefusees: 1,
  livraisonsVides: 243,
  cadenceMinutes: 2,
  cadenceSouhaitee: '15 à 30 min',
  sondes: [
    { nom: "Sonde Potager d'Été", serial: 'b26s002', dernier: '12/08 10 h 41', livraisons72h: 124, mesures24h: 84 },
    { nom: "Sonde Potager d'Hiver", serial: 'b26s001', dernier: '12/08 10 h 37', livraisons72h: 141, mesures24h: 66 },
    { nom: 'Sonde Verger', serial: 'b26s003', dernier: '12/08 11 h 00', livraisons72h: 56, mesures24h: 17 },
  ],
  grandeursRecues: [
    { label: "Température de l'air", unite: '°C', ok: true },
    { label: "Humidité de l'air", unite: '%', ok: true },
    { label: 'Luminosité', unite: 'lx', ok: true },
    { label: 'Indice UV', unite: '—', ok: true },
    { label: 'Capacitance de sol', unite: 'V', ok: true },
    { label: 'Humidité de sol par horizon', unite: '% vol.', ok: false },
    { label: 'Niveau de batterie', unite: '%', ok: false },
  ],
  anomalies: [
    {
      titre: 'Trois livraisons sur quatre arrivent vides',
      detail:
        '243 des 330 envois contiennent « measures: {} » : enveloppe complète (plot, probe, rssi) mais aucun relevé. Probablement le même point republié.',
      impact: 'Journal saturé, aucune valeur ajoutée',
    },
    {
      titre: 'Batterie systématiquement à 0 %',
      detail:
        'batteryPercentage = 0 sur les trois sondes, alors que le signal radio est excellent (rssi −48 à −67 dBm). Champ non renseigné côté passerelle.',
      impact: 'Alerte batterie inexploitable',
    },
    {
      titre: 'Aucune humidité de sol par profondeur',
      detail:
        'Seule la capacitance brute arrive (0,397 à 0,457 V), sans profondeur associée. Les sondes sont pourtant des 5/15, 5/30 et 30/60.',
      impact: 'Registre de sol incomplet — donnée agronomique clé',
    },
  ],
  demandes: [
    'Ne publier une trame que lorsqu’un nouveau relevé existe.',
    'Renseigner batteryPercentage, ou l’omettre franchement.',
    'Transmettre l’humidité volumique par horizon (ou la table tension → humidité).',
    'Ramener la cadence à une livraison toutes les 15 à 30 minutes par sonde.',
  ],
} as const;

export const TRUST_SIGNATURE_RATE =
  Math.round(
    (TRUST_REPORT.livraisonsValides / (TRUST_REPORT.livraisonsValides + TRUST_REPORT.livraisonsRefusees)) * 1000,
  ) / 10;

export const TRUST_UTILE_RATE =
  Math.round(
    ((TRUST_REPORT.livraisonsValides - TRUST_REPORT.livraisonsVides) / TRUST_REPORT.livraisonsValides) * 1000,
  ) / 10;
