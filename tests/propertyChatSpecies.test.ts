import { describe, expect, test } from 'bun:test';
import { propertyChatSpeciesRows, completeSpeciesContext } from '../src/lib/propertyChatSpecies';
import { rollupSpecies, classifyObservations } from '../src/lib/ouvrageScope';
import type { BiodiversitySpecies } from '../src/types/biodiversity';

const plant = (name: string, observations = 1): BiodiversitySpecies => ({
  id: name, scientificName: name, commonName: name, kingdom: 'Plantae',
  family: '', observations, lastSeen: '2026-10-14', source: 'inaturalist', attributions: [],
});

describe('Property chat inventory', () => {
  test('includes every species beyond 200, even a rare final row', () => {
    const species = Array.from({ length: 271 }, (_, i) => plant(`Species ${i}`, 5));
    species.push({ ...plant('Wisteria sinensis'), commonName: 'Glycine de Chine', lastObserved: '2026-10-10' });
    const payload = completeSpeciesContext(propertyChatSpeciesRows(species), 'propriété entière');
    expect(payload.total).toBe(272);
    expect(payload.especes.at(-1)?.n).toBe('Wisteria sinensis');
    expect(payload.especes.at(-1)?.c).toBe('Glycine de Chine');
    expect(payload.tronque).toBe(false);
    expect(payload.exhaustif).toBe(true);
  });

  test('does not require GPS or substitute collection date for observation date', () => {
    const rows = propertyChatSpeciesRows([plant('Wisteria sinensis')]);
    expect(rows).toHaveLength(1);
    expect(rows[0].vu).toBeNull();
  });

  test('deduplicates normalized scientific names', () => {
    const rows = propertyChatSpeciesRows([plant('Wisteria sinensis'), plant(' WISTERIA SINENSIS ', 2)]);
    expect(rows).toHaveLength(1);
    expect(rows[0].obs).toBe(3);
  });

  test('an ouvrage context remains limited to its trace and edge radius', () => {
    const points = [
      { lat: 45, lng: 0, scientificName: 'Wisteria sinensis', commonName: 'Glycine de Chine', kingdom: 'Plantae' },
      { lat: 46, lng: 0, scientificName: 'Outside species', commonName: null, kingdom: 'Plantae' },
    ];
    const scope = classifyObservations({ type: 'Point', coordinates: [0, 45] }, points, 50);
    const rows = rollupSpecies([...scope.dedans, ...scope.lisiere, ...scope.voisinage].map(s => s.item));
    expect(completeSpeciesContext(rows, 'ouvrage · 50 m').especes.map(s => s.n)).toEqual(['Wisteria sinensis']);
  });

  test('only transmits the supplied filtered pool, without widening scope or period', () => {
    const rows = propertyChatSpeciesRows([plant('Filtered species')]);
    expect(completeSpeciesContext(rows, 'cadastre · période retenue').total).toBe(1);
    expect(rows.some(s => s.n === 'Wisteria sinensis')).toBe(false);
  });
});