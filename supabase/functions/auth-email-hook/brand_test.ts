import {
  assertEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { resolveBrand, safeUrlHost } from './brand.ts';

Deno.test('uses FJ metadata first', () => {
  assertEquals(
    resolveBrand({ app: 'frequence-jardin' }, 'https://la-frequence-du-vivant.com'),
    { brand: 'fj', brandSource: 'metadata' }
  );
});

Deno.test('recognizes an FJ recovery marker for a legacy account', () => {
  assertEquals(
    resolveBrand({}, 'https://frequence-jardin.lovable.app/mot-de-passe?auth_brand=fj'),
    { brand: 'fj', brandSource: 'redirect_marker' }
  );
});

Deno.test('recognizes the canonical FJ domain', () => {
  assertEquals(resolveBrand({}, 'https://frequence-jardin.lovable.app/mot-de-passe'), {
    brand: 'fj',
    brandSource: 'redirect_to',
  });
});

Deno.test('recognizes FJ Lovable previews', () => {
  assertEquals(
    resolveBrand({}, 'https://id-preview--frequence-jardin.lovable.app/mot-de-passe'),
    { brand: 'fj', brandSource: 'redirect_to' }
  );
});

Deno.test('keeps LFDV recovery emails unchanged', () => {
  assertEquals(
    resolveBrand({}, 'https://la-frequence-du-vivant.com/marches-du-vivant/reset-password'),
    { brand: 'lfdv', brandSource: 'default' }
  );
});

Deno.test('ignores an FJ marker on a non-FJ domain', () => {
  assertEquals(
    resolveBrand({}, 'https://la-frequence-du-vivant.com/reset-password?auth_brand=fj'),
    { brand: 'lfdv', brandSource: 'default' }
  );
});

Deno.test('falls back safely for an invalid redirect', () => {
  assertEquals(resolveBrand({}, ''), { brand: 'lfdv', brandSource: 'default' });
  assertEquals(safeUrlHost('not-a-url'), null);
});