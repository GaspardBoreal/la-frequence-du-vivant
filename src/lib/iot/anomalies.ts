/**
 * Détection des « valeurs bizarres » de la télémétrie.
 *
 * Sept familles de règles, appliquées uniquement là où elles ont un sens.
 * Tout est pur : entrées = relevés + livraisons de la période, sortie =
 * événements agrégés. Aucune écriture en base, aucune dépendance React.
 *
 * Les métadonnées de règle (nom, explication, signature graphique) vivent ici
 * et sont consommées telles quelles par l'UI : règle détectée et règle
 * expliquée ne peuvent pas diverger.
 */

import { grandeurMeta, fmtMesure, fmtProfondeur, capteurEtat } from '@/lib/iot/grandeurs';

/* ── Règles ────────────────────────────────────────────────────────────── */

export type RegleKey =
  | 'hors_domaine'
  | 'hors_usage'
  | 'incoherence'
  | 'aberrante'
  | 'saut'
  | 'figee'
  | 'silence'
  | 'ingestion';

export type Gravite = 'critique' | 'surveiller' | 'info';

export interface RegleMeta {
  key: RegleKey;
  /** Nom court, tel qu'il s'affiche sur la pastille. */
  nom: string;
  /** Ce que la règle cherche, en une phrase. */
  cherche: string;
  /** Ce qui est volontairement ignoré. */
  ignore: string;
  gravite: Gravite;
  /** Forme de la signature dessinée par la sparkline schématique. */
  signature: 'pic' | 'marche' | 'plateau' | 'trou' | 'nuage' | 'derive' | 'refus';
}

export const REGLES: RegleMeta[] = [
  {
    key: 'hors_domaine',
    nom: 'Hors domaine physique',
    cherche: "Une valeur que la physique interdit : humidité au-delà de 100 %, température de sol hors -40/+80 °C, indice UV négatif…",
    ignore: 'Les grandeurs non lisibles et les trames d’essai.',
    gravite: 'critique',
    signature: 'pic',
  },
  {
    key: 'hors_usage',
    nom: "Hors plage d'usage",
    cherche: "Une valeur possible, mais très inhabituelle au jardin pour cette grandeur (sol à 45 °C, air à -25 °C…).",
    ignore: 'Les grandeurs sans plage d’usage connue.',
    gravite: 'surveiller',
    signature: 'derive',
  },
  {
    key: 'incoherence',
    nom: 'Incohérence entre profondeurs',
    cherche:
      "Deux profondeurs d'une même sonde qui se contredisent au même instant : sol quasi sec en surface alors que le fond est détrempé, sans transition possible.",
    ignore: 'Les grandeurs sans profondeur, et les sondes qui ne mesurent qu’un seul niveau.',
    gravite: 'surveiller',
    signature: 'marche',
  },
  {
    key: 'aberrante',
    nom: 'Valeur aberrante',
    cherche: "Un point très éloigné de l'histoire propre de la sonde, mesuré par un écart robuste (médiane et écart absolu médian).",
    ignore: 'Les séries trop courtes : sans histoire, pas de verdict.',
    gravite: 'surveiller',
    signature: 'nuage',
  },
  {
    key: 'saut',
    nom: 'Saut brutal',
    cherche: "Une variation plus rapide que l'inertie physique de la grandeur : le sol ne prend pas 20 points d'humidité en dix minutes.",
    ignore: 'Les écarts après une longue coupure : le temps écoulé les explique.',
    gravite: 'surveiller',
    signature: 'marche',
  },
  {
    key: 'figee',
    nom: 'Valeur figée',
    cherche: "La même valeur exactement, répétée des heures sur une grandeur censée respirer : signature d'un capteur bloqué.",
    ignore: 'Les grandeurs cumulatives ou naturellement plates (pluie à 0).',
    gravite: 'surveiller',
    signature: 'plateau',
  },
  {
    key: 'silence',
    nom: 'Silence',
    cherche: "Une sonde en service qui se tait alors qu'elle avait sa propre cadence régulière.",
    ignore: 'Les sondes déclarées en maintenance ou retirées.',
    gravite: 'critique',
    signature: 'trou',
  },
  {
    key: 'ingestion',
    nom: 'Ingestion refusée',
    cherche: "Signatures refusées, erreurs de traitement, capteur inconnu, clés écartées à l'entrée du webhook.",
    ignore: 'Les essais fournisseur.',
    gravite: 'info',
    signature: 'refus',
  },
];

export const regleMeta = (k: RegleKey): RegleMeta => REGLES.find((r) => r.key === k)!;

export const GRAVITE_RANK: Record<Gravite, number> = { critique: 0, surveiller: 1, info: 2 };

export const GRAVITE_LABEL: Record<Gravite, string> = {
  critique: 'Critique',
  surveiller: 'À surveiller',
  info: 'Information',
};

/* ── Bornes ────────────────────────────────────────────────────────────── */

/** Domaine physique : au-delà, la valeur est impossible. */
export const DOMAINE: Record<string, [number, number]> = {
  soil_moisture: [0, 100],
  air_humidity: [0, 100],
  soil_temperature: [-40, 80],
  air_temperature: [-60, 70],
  dew_point: [-60, 60],
  pressure: [80_000, 115_000],
  uv_index: [0, 20],
  luminosity: [0, 200_000],
  infrared: [0, 200_000],
  rainfall: [0, 200],
  wind_speed: [0, 90],
  battery_voltage: [0, 6],
};

/** Plage d'usage : dedans, on ne dit rien ; dehors, on invite à regarder. */
export const USAGE: Record<string, [number, number]> = {
  soil_moisture: [2, 60],
  air_humidity: [10, 100],
  soil_temperature: [-10, 40],
  air_temperature: [-20, 45],
  uv_index: [0, 12],
  pressure: [95_000, 105_000],
  wind_speed: [0, 35],
  battery_voltage: [3, 4.5],
};

/** Variation maximale plausible, par heure, pour un même point de mesure. */
export const INERTIE: Record<string, number> = {
  soil_moisture: 25,
  soil_temperature: 6,
  air_temperature: 15,
  air_humidity: 60,
  pressure: 800,
  battery_voltage: 0.6,
};

/** Grandeurs qui peuvent légitimement rester plates (pas de règle « figée »). */
const PLATES = new Set(['rainfall', 'battery_voltage', 'luminosity', 'infrared', 'uv_index', 'wind_speed']);

/* ── Entrées / sorties ─────────────────────────────────────────────────── */

export interface MesureLite {
  capteur_id: string;
  grandeur: string;
  valeur: number;
  unite?: string | null;
  profondeur_m?: number | null;
  mesure_at: string;
}

export interface CapteurLite {
  id: string;
  nom?: string | null;
  serial_number?: string | null;
  etat?: string | null;
}

export interface LivraisonLite {
  id: string;
  serial_number: string | null;
  signature_valid: boolean | null;
  error: string | null;
  created_at: string;
  payload?: any;
}

/** Un point remarquable, affiché sur la sparkline de l'alerte. */
export interface PointSerie {
  t: number;
  v: number;
  fautif?: boolean;
}

export interface IotAlerte {
  id: string;
  regle: RegleKey;
  gravite: Gravite;
  capteurId: string | null;
  capteurNom: string;
  serial: string | null;
  /** Grandeur concernée, `null` pour les alertes de flux. */
  grandeur: string | null;
  profondeur_m: number | null;
  /** Libellé de la grandeur + profondeur, prêt à afficher. */
  grandeurLabel: string;
  debut: string;
  fin: string;
  /** Valeur fautive mise en forme (ou plage). */
  valeur: string;
  /** Commentaire de terrain, en français clair. */
  commentaire: string;
  /** Seuil réellement appliqué, exprimé en clair. */
  seuil: string;
  occurrences: number;
  /** Extrait de série autour de l'anomalie, pour la sparkline. */
  serie: PointSerie[];
  /** Sonde en maintenance au moment de la lecture. */
  maintenance?: boolean;
}

export interface AnomalyReport {
  alertes: IotAlerte[];
  /** Nombre de relevés réellement contrôlés. */
  controles: number;
  /** Nombre de sondes analysées. */
  sondes: number;
  /** Nombre de relevés impliqués dans au moins une alerte. */
  signales: number;
  parRegle: Record<RegleKey, number>;
}

/* ── Utilitaires ───────────────────────────────────────────────────────── */

const ms = (iso: string) => new Date(iso).getTime();

const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const fmtDuree = (h: number) =>
  h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} j`;

const slotLabel = (g: string, p?: number | null) => {
  const d = fmtProfondeur(p ?? null);
  return d ? `${grandeurMeta(g).label} · ${d}` : grandeurMeta(g).label;
};

/** Extrait une fenêtre de série autour d'indices fautifs, pour la sparkline. */
const extrait = (serie: MesureLite[], fautifs: Set<number>, centre: number): PointSerie[] => {
  const from = Math.max(0, centre - 12);
  const to = Math.min(serie.length, centre + 13);
  return serie.slice(from, to).map((m, i) => ({
    t: ms(m.mesure_at),
    v: m.valeur,
    fautif: fautifs.has(from + i),
  }));
};

/* ── Détection ─────────────────────────────────────────────────────────── */

const KEY_SEP = '¤';
const slotKey = (m: MesureLite) => `${m.capteur_id}${KEY_SEP}${m.grandeur}${KEY_SEP}${m.profondeur_m ?? ''}`;

/**
 * Analyse une période complète.
 *
 * @param mesures relevés déjà filtrés (grandeurs lisibles, essais exclus)
 * @param capteurs sondes du périmètre
 * @param livraisons journal de la même période
 */
export function analyserAnomalies(
  mesures: MesureLite[],
  capteurs: CapteurLite[],
  livraisons: LivraisonLite[],
  now = Date.now(),
): AnomalyReport {
  const alertes: IotAlerte[] = [];
  const signales = new Set<string>();
  const capteurById = new Map(capteurs.map((c) => [c.id, c]));

  const nomDe = (id: string | null) => {
    const c = id ? capteurById.get(id) : null;
    return c?.nom ?? c?.serial_number ?? 'Sonde inconnue';
  };

  /* Regroupement par point de mesure (sonde × grandeur × profondeur). */
  const slots = new Map<string, MesureLite[]>();
  mesures.forEach((m) => {
    if (!Number.isFinite(m.valeur)) return;
    const arr = slots.get(slotKey(m)) ?? [];
    arr.push(m);
    slots.set(slotKey(m), arr);
  });

  slots.forEach((brut, key) => {
    const serie = [...brut].sort((a, b) => ms(a.mesure_at) - ms(b.mesure_at));
    const [capteurId, grandeur] = key.split(KEY_SEP);
    const capteur = capteurById.get(capteurId);
    const enMaintenance = capteurEtat(capteur ?? null) !== 'service';
    const prof = serie[0].profondeur_m ?? null;
    const meta = grandeurMeta(grandeur);
    const label = slotLabel(grandeur, prof);
    const base = {
      capteurId,
      capteurNom: nomDe(capteurId),
      serial: capteur?.serial_number ?? null,
      grandeur,
      profondeur_m: prof,
      grandeurLabel: label,
      maintenance: enMaintenance,
    };
    const marque = (i: number) => signales.add(`${key}${KEY_SEP}${i}`);

    /* 1 · Hors domaine physique. */
    const dom = DOMAINE[grandeur];
    if (dom) {
      const idx = serie.map((m, i) => (m.valeur < dom[0] || m.valeur > dom[1] ? i : -1)).filter((i) => i >= 0);
      if (idx.length) {
        idx.forEach(marque);
        const vals = idx.map((i) => serie[i].valeur);
        const pire = idx[vals.indexOf(Math.max(...vals.map((v) => Math.abs(v))))];
        alertes.push({
          ...base,
          id: `${key}-dom`,
          regle: 'hors_domaine',
          gravite: 'critique',
          debut: serie[idx[0]].mesure_at,
          fin: serie[idx[idx.length - 1]].mesure_at,
          valeur: fmtMesure(serie[pire].valeur, grandeur, serie[pire].unite),
          seuil: `Domaine admis : ${dom[0]} à ${dom[1]} ${meta.unite}`,
          commentaire: `${label} sort du domaine physique (${dom[0]}–${dom[1]} ${meta.unite}). La sonde renvoie une valeur impossible : le relevé ne doit pas être lu comme une mesure de terrain.`,
          occurrences: idx.length,
          serie: extrait(serie, new Set(idx), pire),
        });
      }
    }

    if (enMaintenance) return; // maintenance : seules les règles 1 et 7 s'appliquent

    /* 2 · Hors plage d'usage (hors valeurs déjà hors domaine). */
    const use = USAGE[grandeur];
    if (use) {
      const idx = serie
        .map((m, i) =>
          (m.valeur < use[0] || m.valeur > use[1]) && (!dom || (m.valeur >= dom[0] && m.valeur <= dom[1])) ? i : -1,
        )
        .filter((i) => i >= 0);
      if (idx.length) {
        idx.forEach(marque);
        const vals = idx.map((i) => serie[i].valeur);
        const pire = idx[vals.indexOf(Math.max(...vals.map((v) => Math.abs(v - (use[0] + use[1]) / 2))))];
        alertes.push({
          ...base,
          id: `${key}-usage`,
          regle: 'hors_usage',
          gravite: 'surveiller',
          debut: serie[idx[0]].mesure_at,
          fin: serie[idx[idx.length - 1]].mesure_at,
          valeur: fmtMesure(serie[pire].valeur, grandeur, serie[pire].unite),
          seuil: `Plage d'usage : ${use[0]} à ${use[1]} ${meta.unite}`,
          commentaire: `${label} sort de la plage d'usage habituelle au jardin (${use[0]}–${use[1]} ${meta.unite}). La valeur reste physiquement possible : à confirmer sur place avant d'en tirer une conclusion.`,
          occurrences: idx.length,
          serie: extrait(serie, new Set(idx), pire),
        });
      }
    }

    /* 3 · Valeur aberrante (écart robuste), si l'histoire est suffisante. */
    if (serie.length >= 24) {
      const vals = serie.map((m) => m.valeur);
      const med = median(vals);
      const mad = median(vals.map((v) => Math.abs(v - med)));
      const echelle = mad > 0 ? mad * 1.4826 : 0;
      if (echelle > 0) {
        const seuil = 6; // volontairement sévère : on ne veut pas crier au loup
        const idx = vals.map((v, i) => (Math.abs(v - med) / echelle > seuil ? i : -1)).filter((i) => i >= 0);
        // Une série trop bruyante partout n'est pas une anomalie ponctuelle.
        if (idx.length && idx.length <= Math.max(3, Math.round(serie.length * 0.05))) {
          idx.forEach(marque);
          const pire = idx.reduce((a, b) => (Math.abs(vals[b] - med) > Math.abs(vals[a] - med) ? b : a), idx[0]);
          alertes.push({
            ...base,
            id: `${key}-mad`,
            regle: 'aberrante',
            gravite: 'surveiller',
            debut: serie[idx[0]].mesure_at,
            fin: serie[idx[idx.length - 1]].mesure_at,
            valeur: fmtMesure(vals[pire], grandeur, serie[pire].unite),
            seuil: `Habituel : ${med.toFixed(meta.digits)} ${meta.unite} ± ${(echelle * seuil).toFixed(meta.digits)}`,
            commentaire: `${label} s'écarte très fortement de l'habitude de cette sonde (médiane ${med.toFixed(meta.digits)} ${meta.unite} sur ${serie.length} relevés). ${idx.length === 1 ? 'Un point isolé' : `${idx.length} points`} : capteur perturbé, ou événement réel à vérifier.`,
            occurrences: idx.length,
            serie: extrait(serie, new Set(idx), pire),
          });
        }
      }
    }

    /* 4 · Saut brutal. */
    const inertie = INERTIE[grandeur];
    if (inertie && serie.length >= 3) {
      const idx: number[] = [];
      for (let i = 1; i < serie.length; i += 1) {
        const dt = (ms(serie[i].mesure_at) - ms(serie[i - 1].mesure_at)) / 3_600_000;
        if (dt <= 0 || dt > 3) continue; // après une coupure, l'écart s'explique
        const dv = Math.abs(serie[i].valeur - serie[i - 1].valeur);
        if (dv > inertie * Math.max(dt, 1 / 6)) idx.push(i);
      }
      if (idx.length) {
        idx.forEach(marque);
        const pire = idx.reduce(
          (a, b) => (Math.abs(serie[b].valeur - serie[b - 1].valeur) > Math.abs(serie[a].valeur - serie[a - 1].valeur) ? b : a),
          idx[0],
        );
        const ecart = Math.abs(serie[pire].valeur - serie[pire - 1].valeur);
        alertes.push({
          ...base,
          id: `${key}-saut`,
          regle: 'saut',
          gravite: 'surveiller',
          debut: serie[idx[0] - 1].mesure_at,
          fin: serie[idx[idx.length - 1]].mesure_at,
          valeur: `${serie[pire - 1].valeur.toFixed(meta.digits)} → ${fmtMesure(serie[pire].valeur, grandeur, serie[pire].unite)}`,
          seuil: `Variation plausible : ${inertie} ${meta.unite} par heure au plus`,
          commentaire: `${label} change de ${ecart.toFixed(meta.digits)} ${meta.unite} d'un relevé à l'autre, plus vite que l'inertie physique de la grandeur. Signature d'un décrochage de sonde ou d'un contact intermittent.`,
          occurrences: idx.length,
          serie: extrait(serie, new Set(idx), pire),
        });
      }
    }

    /* 5 · Valeur figée. */
    if (!PLATES.has(grandeur) && serie.length >= 8) {
      let debut = 0;
      const plateaux: Array<[number, number]> = [];
      for (let i = 1; i <= serie.length; i += 1) {
        const meme = i < serie.length && serie[i].valeur === serie[debut].valeur;
        if (!meme) {
          const heures = (ms(serie[i - 1].mesure_at) - ms(serie[debut].mesure_at)) / 3_600_000;
          if (i - debut >= 6 && heures >= 6) plateaux.push([debut, i - 1]);
          debut = i;
        }
      }
      if (plateaux.length) {
        const [a, b] = plateaux.reduce((x, y) => (y[1] - y[0] > x[1] - x[0] ? y : x));
        for (let i = a; i <= b; i += 1) marque(i);
        const heures = (ms(serie[b].mesure_at) - ms(serie[a].mesure_at)) / 3_600_000;
        alertes.push({
          ...base,
          id: `${key}-figee`,
          regle: 'figee',
          gravite: 'surveiller',
          debut: serie[a].mesure_at,
          fin: serie[b].mesure_at,
          valeur: fmtMesure(serie[a].valeur, grandeur, serie[a].unite),
          seuil: 'Plateau signalé au-delà de 6 relevés identiques et 6 heures',
          commentaire: `${label} reste exactement à la même valeur pendant ${fmtDuree(heures)} (${b - a + 1} relevés). Une grandeur vivante respire toujours un peu : la sonde semble figée.`,
          occurrences: plateaux.length,
          serie: extrait(serie, new Set(Array.from({ length: b - a + 1 }, (_, i) => a + i)), Math.round((a + b) / 2)),
        });
      }
    }
  });

  /* 6 · Silence, calculé sur la cadence propre de chaque sonde. */
  const parCapteur = new Map<string, MesureLite[]>();
  mesures.forEach((m) => {
    const arr = parCapteur.get(m.capteur_id) ?? [];
    arr.push(m);
    parCapteur.set(m.capteur_id, arr);
  });

  parCapteur.forEach((list, capteurId) => {
    const capteur = capteurById.get(capteurId);
    if (!capteur || capteurEtat(capteur) !== 'service') return;
    const temps = Array.from(new Set(list.map((m) => ms(m.mesure_at)))).sort((a, b) => a - b);
    if (temps.length < 12) return;
    const ecarts: number[] = [];
    for (let i = 1; i < temps.length; i += 1) ecarts.push((temps[i] - temps[i - 1]) / 3_600_000);
    const cadence = median(ecarts);
    if (!Number.isFinite(cadence) || cadence <= 0) return;
    const seuilH = Math.max(cadence * 6, 3);

    const trous: Array<[number, number]> = [];
    for (let i = 1; i < temps.length; i += 1) {
      if ((temps[i] - temps[i - 1]) / 3_600_000 > seuilH) trous.push([temps[i - 1], temps[i]]);
    }
    const depuis = (now - temps[temps.length - 1]) / 3_600_000;
    if (depuis > seuilH) trous.push([temps[temps.length - 1], now]);
    if (!trous.length) return;

    const pire = trous.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
    const heures = (pire[1] - pire[0]) / 3_600_000;
    alertes.push({
      id: `${capteurId}-silence`,
      regle: 'silence',
      gravite: heures > seuilH * 3 ? 'critique' : 'surveiller',
      capteurId,
      capteurNom: nomDe(capteurId),
      serial: capteur.serial_number ?? null,
      grandeur: null,
      profondeur_m: null,
      grandeurLabel: 'Toutes grandeurs',
      debut: new Date(pire[0]).toISOString(),
      fin: new Date(pire[1]).toISOString(),
      valeur: `${fmtDuree(heures)} sans relevé`,
      seuil: `Cadence propre : un relevé toutes les ${fmtDuree(cadence)} · silence signalé au-delà de ${fmtDuree(seuilH)}`,
      commentaire: `Cette sonde émet d'ordinaire toutes les ${fmtDuree(cadence)}. Elle s'est tue pendant ${fmtDuree(heures)}${trous.length > 1 ? ` (et ${trous.length - 1} autre${trous.length > 2 ? 's' : ''} coupure${trous.length > 2 ? 's' : ''} sur la période)` : ''}. Alimentation, couverture réseau ou passerelle à vérifier.`,
      occurrences: trous.length,
      serie: temps.slice(-40).map((t) => ({ t, v: 1 })),
    });
  });

  /* 7 · Anomalies d'ingestion, regroupées par motif. */
  const groupes = new Map<string, { motif: string; serial: string | null; rows: LivraisonLite[] }>();
  livraisons.forEach((d) => {
    let motif: string | null = null;
    if (d.signature_valid === false) motif = 'Signature refusée';
    else if (d.error) motif = d.error;
    if (!motif) {
      const ignored = Array.isArray(d.payload?._lfdv?.ignored) ? d.payload._lfdv.ignored : [];
      if (ignored.length) {
        const raisons = Array.from(new Set(ignored.map((i: any) => String(i.reason ?? 'clé inconnue'))));
        motif = `Relevés écartés à l'entrée (${raisons.join(', ')})`;
      }
    }
    if (!motif) return;
    const k = `${d.serial_number ?? '?'}${KEY_SEP}${motif}`;
    const g = groupes.get(k) ?? { motif, serial: d.serial_number, rows: [] };
    g.rows.push(d);
    groupes.set(k, g);
  });

  groupes.forEach((g, k) => {
    const rows = [...g.rows].sort((a, b) => ms(a.created_at) - ms(b.created_at));
    const capteur = capteurs.find((c) => c.serial_number === g.serial) ?? null;
    alertes.push({
      id: `ing-${k}`,
      regle: 'ingestion',
      gravite: g.motif === 'Signature refusée' ? 'critique' : 'info',
      capteurId: capteur?.id ?? null,
      capteurNom: capteur?.nom ?? g.serial ?? 'Sonde inconnue',
      serial: g.serial,
      grandeur: null,
      profondeur_m: null,
      grandeurLabel: 'Flux entrant',
      debut: rows[0].created_at,
      fin: rows[rows.length - 1].created_at,
      valeur: `${rows.length} livraison${rows.length > 1 ? 's' : ''}`,
      seuil: 'Toute livraison refusée ou partiellement écartée est signalée',
      commentaire: `${g.motif}. ${rows.length} livraison${rows.length > 1 ? 's concernées' : ' concernée'} sur la période : la donnée correspondante n'est jamais entrée en base, les courbes ne la montrent donc pas.`,
      occurrences: rows.length,
      serie: rows.slice(-40).map((r) => ({ t: ms(r.created_at), v: 1, fautif: true })),
    });
  });

  /* Tri : gravité puis date la plus récente. */
  alertes.sort((a, b) => {
    const g = GRAVITE_RANK[a.gravite] - GRAVITE_RANK[b.gravite];
    if (g !== 0) return g;
    return ms(b.fin) - ms(a.fin);
  });

  const parRegle = REGLES.reduce((acc, r) => {
    acc[r.key] = alertes.filter((a) => a.regle === r.key).length;
    return acc;
  }, {} as Record<RegleKey, number>);

  return {
    alertes,
    controles: mesures.length,
    sondes: parCapteur.size,
    signales: signales.size,
    parRegle,
  };
}

/** Fenêtre d'observatoire encadrant une alerte, avec une marge de lecture. */
export function fenetreObservatoire(a: IotAlerte): { from: string; to: string } {
  const d = ms(a.debut);
  const f = ms(a.fin);
  const marge = Math.max((f - d) * 0.5, 6 * 3_600_000);
  return {
    from: new Date(d - marge).toISOString(),
    to: new Date(Math.min(f + marge, Date.now())).toISOString(),
  };
}
