/**
 * Modèle de croissance continu du Scénographe.
 *
 * Le plan pose des espèces avec une envergure adulte. Pour se projeter, il faut
 * savoir ce que la scène donne *avant* l'âge adulte : une jeune plantation, un
 * massif à trois ans, l'ouvrage abouti. On interpole donc de façon continue
 * (courbe logistique) entre la motte et l'ampleur adulte, en tenant compte du
 * fait qu'une herbacée atteint sa taille en une saison là où un arbre met
 * des décennies.
 */
import { STRATES, type Strate } from '@/lib/plantSpread';
import type { Planting } from '@/hooks/propriete/useOuvrageScenarios';

/** Années nécessaires pour atteindre ~90 % de l'ampleur adulte, par strate. */
const MATURITY_YEARS: Record<Strate, number> = {
  'couvre-sol': 1.5,
  herbacee: 2,
  'sous-arbrisseau': 3,
  arbuste: 6,
  grimpante: 4,
  arbre: 18,
  aquatique: 2,
};

/** Part de l'ampleur adulte déjà présente le jour de la plantation. */
const PLANTING_RATIO: Record<Strate, number> = {
  'couvre-sol': 0.35,
  herbacee: 0.3,
  'sous-arbrisseau': 0.25,
  arbuste: 0.18,
  grimpante: 0.2,
  arbre: 0.12,
  aquatique: 0.3,
};

export const YEAR_MIN = 0;
export const YEAR_MAX = 10;

/** Facteur de croissance 0→1 d'une strate à une année donnée. */
export function growthFactor(strate: Strate, year: number): number {
  const y = Math.max(0, year);
  const m = MATURITY_YEARS[strate] ?? 5;
  const start = PLANTING_RATIO[strate] ?? 0.25;
  // Logistique recalée : f(0) = start, f(m) ≈ 0.9, asymptote 1.
  const k = 4.4 / m;
  const raw = 1 / (1 + Math.exp(-k * (y - m / 2)));
  const raw0 = 1 / (1 + Math.exp(k * (m / 2)));
  const norm = (raw - raw0) / (1 - raw0);
  return start + (1 - start) * Math.min(1, Math.max(0, norm));
}

export interface PlantSize {
  /** Envergure (diamètre) en mètres à l'année demandée. */
  spreadM: number;
  /** Hauteur en mètres à l'année demandée. */
  heightM: number;
  /** Hauteur adulte de référence. */
  adultHeightM: number;
  factor: number;
}

/** Taille d'une plante posée, à une année donnée. */
export function sizeAt(p: Planting, year: number): PlantSize {
  const info = STRATES[p.strate] ?? STRATES.herbacee;
  const adultSpread = p.spreadM || info.spreadM;
  // Une plante plus large que la moyenne de sa strate est aussi plus haute.
  const adultHeight = info.heightM * Math.max(0.5, Math.min(2.2, adultSpread / info.spreadM));
  const f = growthFactor(p.strate, year);
  return {
    spreadM: adultSpread * f,
    heightM: adultHeight * f,
    adultHeightM: adultHeight,
    factor: f,
  };
}

/* ------------------------------------------------------------------ */
/* Projection géographique locale (mètres autour d'un centre)          */
/* ------------------------------------------------------------------ */

export interface LocalPoint {
  /** Est (m) */
  x: number;
  /** Nord (m) */
  y: number;
}

export const M_PER_DEG_LAT = 110_574;
export const mPerDegLng = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

export function centroidOf(plantings: Planting[]): { lat: number; lng: number } {
  if (!plantings.length) return { lat: 0, lng: 0 };
  const lat = plantings.reduce((s, p) => s + p.lat, 0) / plantings.length;
  const lng = plantings.reduce((s, p) => s + p.lng, 0) / plantings.length;
  return { lat, lng };
}

export function toLocal(p: { lat: number; lng: number }, center: { lat: number; lng: number }): LocalPoint {
  return {
    x: (p.lng - center.lng) * mPerDegLng(center.lat),
    y: (p.lat - center.lat) * M_PER_DEG_LAT,
  };
}

/** Rayon (m) englobant toutes les plantes depuis le centre. */
export function sceneRadius(plantings: Planting[], center: { lat: number; lng: number }): number {
  let r = 2;
  plantings.forEach((p) => {
    const l = toLocal(p, center);
    r = Math.max(r, Math.hypot(l.x, l.y) + (p.spreadM || 1) / 2);
  });
  return r;
}

/** Hash déterministe : une même espèce garde toujours la même allure. */
export function seedOf(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Générateur pseudo-aléatoire reproductible à partir d'une graine. */
export function rng(seed: number) {
  let s = Math.floor(seed * 2 ** 31) || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
