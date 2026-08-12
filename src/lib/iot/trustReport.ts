/**
 * Rapport de confiance de la chaîne télémétrie BRAD × La Fréquence du Vivant.
 * Les chiffres ne sont plus figés : ils sont recalculés en base par la RPC
 * `get_iot_trust_report(p_since)` à chaque ouverture de la page protégée
 * /trust-in-frequence-vivant, depuis une date de départ choisie.
 */

export const TRUST_PASSWORD = 'WINWINBRAD-LFDV';

/* ── Formes renvoyées par la RPC ───────────────────────────────────────── */

export type TrustSonde = {
  id: string;
  nom: string;
  serial_number: string;
  last_seen_at: string | null;
  battery_pct: number | null;
  rssi: number | null;
  livraisons: number;
  livraisons_utiles: number;
  mesures: number;
  derniere_mesure: string | null;
  mesures_humidite_sol: number;
  mesures_avec_profondeur: number;
};

export type TrustGrandeur = {
  grandeur: string;
  n: number;
  unite: string | null;
  derniere: string | null;
  avec_profondeur: number;
};

export type TrustReport = {
  since: string;
  generated_at: string;
  fenetre_minutes: number;
  livraisons_total: number;
  livraisons_valides: number;
  livraisons_refusees: number;
  livraisons_vides: number;
  livraisons_utiles: number;
  livraisons_essais: number;
  erreurs_applicatives: number;
  mesures_total: number;
  sondes: TrustSonde[];
  grandeurs: TrustGrandeur[];
  batterie: {
    n_batt: number;
    n_batt_pos: number;
    batt_max: number | null;
    batt_ok_at: string | null;
  } | null;
};

/* ── Fenêtres de lecture ───────────────────────────────────────────────── */

export type TrustWindowKey = 'ce_matin' | 'h24' | 'h72' | 'h6';

/** 10 h 00 heure de Paris, aujourd'hui (ou hier s'il est plus tôt que 10 h). */
export function ceMatin10h(now = new Date()): Date {
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const shift = now.getTime() - paris.getTime();
  const cible = new Date(paris);
  cible.setHours(10, 0, 0, 0);
  if (cible.getTime() > paris.getTime()) cible.setDate(cible.getDate() - 1);
  return new Date(cible.getTime() + shift);
}

export const TRUST_WINDOWS: { key: TrustWindowKey; label: string; since: () => Date }[] = [
  { key: 'ce_matin', label: 'Depuis 10 h ce matin', since: () => ceMatin10h() },
  { key: 'h6', label: '6 dernières heures', since: () => new Date(Date.now() - 6 * 3600e3) },
  { key: 'h24', label: '24 dernières heures', since: () => new Date(Date.now() - 24 * 3600e3) },
  { key: 'h72', label: '72 dernières heures', since: () => new Date(Date.now() - 72 * 3600e3) },
];

/* ── Grandeurs attendues ───────────────────────────────────────────────── */

export const GRANDEUR_LABELS: Record<string, string> = {
  air_temperature: "Température de l'air",
  air_humidity: "Humidité de l'air",
  luminosity: 'Luminosité',
  uv_index: 'Indice UV',
  soil_capacitance: 'Capacitance de sol',
  soil_moisture: 'Humidité de sol (par horizon)',
  soil_temperature: 'Température de sol',
  dew_point: 'Point de rosée',
  pressure: 'Pression',
  rainfall: 'Pluviométrie',
  infrared: 'Infrarouge',
};

const ATTENDUES = [
  'air_temperature',
  'air_humidity',
  'luminosity',
  'uv_index',
  'soil_capacitance',
  'soil_moisture',
] as const;

export type GrandeurEtat = { key: string; label: string; unite: string; n: number; ok: boolean };

export function grandeursEtat(r: TrustReport): GrandeurEtat[] {
  const map = new Map(r.grandeurs.map((g) => [g.grandeur, g]));
  const base = ATTENDUES.map((k) => {
    const g = map.get(k);
    return {
      key: k,
      label: GRANDEUR_LABELS[k] ?? k,
      unite: g?.unite ?? (k === 'soil_moisture' ? '% vol.' : '—'),
      n: g?.n ?? 0,
      ok: !!g && g.n > 0,
    };
  });
  const extra = r.grandeurs
    .filter((g) => !ATTENDUES.includes(g.grandeur as (typeof ATTENDUES)[number]))
    .map((g) => ({ key: g.grandeur, label: GRANDEUR_LABELS[g.grandeur] ?? g.grandeur, unite: g.unite ?? '—', n: g.n, ok: true }));
  return [...base, ...extra];
}

/* ── Indicateurs dérivés ───────────────────────────────────────────────── */

export const pct = (num: number, den: number) => (den <= 0 ? 100 : Math.round((num / den) * 1000) / 10);

export function tauxSignature(r: TrustReport) {
  return pct(r.livraisons_valides, r.livraisons_total);
}
export function tauxUtile(r: TrustReport) {
  return pct(r.livraisons_utiles, r.livraisons_valides);
}
export function cadenceMinutes(r: TrustReport) {
  const sondes = Math.max(1, r.sondes.length);
  const parSonde = r.livraisons_valides / sondes;
  if (parSonde <= 0) return null;
  return Math.round((r.fenetre_minutes / parSonde) * 10) / 10;
}

export type Anomalie = {
  id: 'vides' | 'batterie' | 'humidite';
  titre: string;
  detail: string;
  impact: string;
  resolu: boolean;
  resolution?: string;
};

export function anomalies(r: TrustReport): Anomalie[] {
  const humiditeSol = r.sondes.reduce((s, x) => s + x.mesures_humidite_sol, 0);
  const avecProfondeur = r.sondes.reduce((s, x) => s + x.mesures_avec_profondeur, 0);
  const b = r.batterie;

  return [
    {
      id: 'vides',
      titre: 'Trames sans aucun relevé',
      detail:
        r.livraisons_vides > 0
          ? `${r.livraisons_vides} des ${r.livraisons_valides} envois signés arrivent avec « measures: {} » : enveloppe complète (plot, probe, rssi) mais aucun point de mesure.`
          : `Aucune trame vide sur la fenêtre : les ${r.livraisons_valides} envois signés portent tous au moins un relevé.`,
      impact: 'Journal saturé, aucune valeur ajoutée',
      resolu: r.livraisons_vides === 0 && r.livraisons_valides > 0,
      resolution: 'Corrigé — plus une seule trame vide sur la fenêtre observée.',
    },
    {
      id: 'batterie',
      titre: 'Niveau de batterie non renseigné',
      detail:
        b && b.n_batt_pos === 0
          ? `batteryPercentage = 0 sur ${b.n_batt} envois, alors que le lien radio est bon (rssi ${r.sondes.map((s) => s.rssi).filter((v) => v != null).join(', ') || '—'} dBm). Champ manifestement non alimenté côté passerelle.`
          : `Batterie transmise (jusqu'à ${b?.batt_max ?? '—'} %).`,
      impact: 'Alerte batterie inexploitable',
      resolu: !!b && b.n_batt_pos > 0,
      resolution: b?.batt_ok_at ? `Corrigé — première valeur non nulle reçue le ${fmtFR(b.batt_ok_at)}.` : undefined,
    },
    {
      id: 'humidite',
      titre: 'Humidité de sol par profondeur absente',
      detail:
        humiditeSol === 0
          ? "Seule la capacitance brute arrive, sans profondeur associée. Les sondes sont pourtant des 5/15, 5/30 et 30/60 : il manque l'humidité volumique par horizon, ou à défaut la table de conversion tension → humidité."
          : `${humiditeSol} relevés d'humidité de sol reçus, dont ${avecProfondeur} avec une profondeur explicite.`,
      impact: 'Registre de sol incomplet — donnée agronomique clé',
      resolu: humiditeSol > 0 && avecProfondeur > 0,
      resolution: 'Corrigé — humidité par horizon reçue et rattachée à sa profondeur.',
    },
  ];
}

export const DEMANDES = [
  'Ne publier une trame que lorsqu’un nouveau relevé existe.',
  'Renseigner batteryPercentage, ou l’omettre franchement plutôt que d’envoyer 0.',
  'Transmettre l’humidité volumique par horizon (ou la table tension → humidité).',
  'Cadence cible : une livraison toutes les 15 à 30 minutes par sonde.',
];

export const QUESTIONS_OUVERTES = [
  'La capacitance en volts peut-elle être convertie en humidité volumique ? Si oui, avec quelle table par type de sonde (5/15, 5/30, 30/60) ?',
  'Chaque horizon de la sonde peut-il être publié comme une mesure distincte portant sa profondeur en centimètres ?',
  'batteryPercentage provient-il du module radio ou de la sonde ? Peut-il être omis tant qu’il n’est pas fiable ?',
  'Quelle cadence de publication recommandez-vous pour un suivi agronomique quotidien, en tenant compte de l’autonomie ?',
];

/* ── Formatage ─────────────────────────────────────────────────────────── */

export function fmtFR(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function fmtFRLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function depuisMinutes(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/* ── Génération Markdown (mêmes chiffres que l'écran) ──────────────────── */

export function buildTrustMarkdown(r: TrustReport): string {
  const cad = cadenceMinutes(r);
  const g = grandeursEtat(r);
  const an = anomalies(r);
  const L: string[] = [];

  L.push('# Rapport de télémétrie — BRAD × La Fréquence du Vivant');
  L.push('');
  L.push(`- **Fenêtre de lecture** : depuis le ${fmtFRLong(r.since)} (heure de Paris)`);
  L.push(`- **Généré le** : ${fmtFRLong(r.generated_at)}`);
  L.push('- **Site** : Jardin Monde DEVIAT (France) — 3 sondes de sol BRAD (5/15, 5/30, 30/60)');
  L.push('- **Chaîne** : passerelle BRAD → webhook signé HMAC-SHA256 → base La Fréquence du Vivant');
  L.push('- **Méthode** : agrégation directe en base (journal des livraisons + mesures normalisées en unités SI)');
  L.push('');
  L.push('## 1. Réception');
  L.push('');
  L.push('| Indicateur | Valeur |');
  L.push('| --- | --- |');
  L.push(`| Livraisons reçues | ${r.livraisons_total} |`);
  L.push(`| Signature HMAC valide | ${r.livraisons_valides} (${tauxSignature(r)} %) |`);
  L.push(`| Signature refusée | ${r.livraisons_refusees} |`);
  L.push(`| Trames portant au moins un relevé | ${r.livraisons_utiles} (${tauxUtile(r)} %) |`);
  L.push(`| Trames vides (« measures: {} ») | ${r.livraisons_vides} |`);
  L.push(`| Envois de sondes d'essai (série inconnue) | ${r.livraisons_essais} |`);
  L.push(`| Erreurs applicatives | ${r.erreurs_applicatives} |`);
  L.push(`| Mesures enregistrées | ${r.mesures_total} |`);
  L.push(`| Cadence observée | ${cad ? `≈ 1 livraison / ${cad} min / sonde` : '—'} |`);
  L.push('');
  L.push('## 2. Sondes');
  L.push('');
  L.push('| Sonde | N° série | Dernier signal | Livraisons | Mesures | Humidité de sol |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  for (const s of r.sondes) {
    L.push(
      `| ${s.nom} | ${s.serial_number} | ${fmtFR(s.last_seen_at)} | ${s.livraisons} | ${s.mesures} | ${s.mesures_humidite_sol > 0 ? `${s.mesures_humidite_sol} relevés` : 'aucune'} |`,
    );
  }
  L.push('');
  L.push('## 3. Grandeurs');
  L.push('');
  L.push('| Grandeur | Unité | Relevés sur la fenêtre | État |');
  L.push('| --- | --- | --- | --- |');
  for (const x of g) L.push(`| ${x.label} | ${x.unite} | ${x.n} | ${x.ok ? 'reçue' : 'MANQUANTE'} |`);
  L.push('');
  L.push('## 4. Anomalies');
  L.push('');
  an.forEach((a, i) => {
    L.push(`### ${i + 1}. ${a.titre} — ${a.resolu ? 'RÉSOLU' : 'OUVERT'}`);
    L.push('');
    L.push(a.resolu && a.resolution ? `${a.resolution} ${a.detail}` : a.detail);
    L.push('');
    if (!a.resolu) L.push(`_Impact : ${a.impact}._`);
    L.push('');
  });
  L.push('## 5. Demandes côté passerelle');
  L.push('');
  for (const d of DEMANDES) L.push(`- ${d}`);
  L.push('');
  L.push('## 6. Questions ouvertes à l’intégrateur');
  L.push('');
  QUESTIONS_OUVERTES.forEach((q, i) => L.push(`${i + 1}. ${q}`));
  L.push('');
  L.push('---');
  L.push('');
  L.push('Document confidentiel — La Fréquence du Vivant · Jardin Monde DEVIAT.');
  return L.join('\n');
}

export function buildBriefMarkdown(r: TrustReport): string {
  return [
    '# Brief — analyse de la chaîne télémétrie BRAD',
    '',
    "Tu es l'ingénieur télémétrie côté fournisseur (BRAD Technology). Tu reçois ci-dessous le relevé de conformité produit automatiquement par la plateforme cliente, La Fréquence du Vivant, à partir des livraisons réellement reçues.",
    '',
    'Ta mission :',
    '',
    '1. Confirmer ou contester chaque anomalie, en te fondant uniquement sur les chiffres du rapport.',
    '2. Proposer, pour chaque anomalie ouverte, une correction précise côté passerelle (champ, format, cadence).',
    "3. Répondre aux questions ouvertes de la section 6, en signalant ce qui dépend du matériel et ce qui dépend du firmware.",
    "4. Terminer par une liste courte « ce que je m'engage à corriger » avec un délai indicatif.",
    '',
    'Réponds en français, en markdown, sans inventer de valeur absente du rapport.',
    '',
    '---',
    '',
    buildTrustMarkdown(r),
  ].join('\n');
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
