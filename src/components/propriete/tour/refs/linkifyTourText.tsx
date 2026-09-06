import React from 'react';
import { Leaf, TestTube2, Shapes, Wrench, Radio } from 'lucide-react';
import { openTourRef } from './tourRefStore';
import { normRef, type TourRef, type TourRefKind } from './types';
import type { TourRefIndex } from './useTourRefIndex';

const KIND_ICON: Record<TourRefKind, React.ReactNode> = {
  species: <Leaf className="h-3 w-3" />,
  sample: <TestTube2 className="h-3 w-3" />,
  zone: <Shapes className="h-3 w-3" />,
  objet: <Wrench className="h-3 w-3" />,
  capteur: <Radio className="h-3 w-3" />,
};

interface Hit {
  start: number;
  end: number;
  text: string;
  ref?: TourRef;
  emphasis?: 'bold' | 'italic';
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Repère dans un texte les ressources qui existent réellement sur le lieu. */
function findHits(text: string, index: TourRefIndex, explicit: TourRef[]): Hit[] {
  const hits: Hit[] = [];

  const addLiteral = (label: string, ref: TourRef) => {
    if (!label || label.length < 4) return;
    const re = new RegExp(escapeRe(label), 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      hits.push({ start: m.index, end: m.index + m[0].length, text: m[0], ref });
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  };

  // 1. Références explicites fournies par l'IA
  for (const r of explicit) addLiteral(r.label, r);

  // 2. Emphase markdown : *latin* ou **gras**
  const emph = /\*\*(.+?)\*\*|\*([^*]+)\*/g;
  let e: RegExpExecArray | null;
  while ((e = emph.exec(text))) {
    const inner = (e[1] ?? e[2] ?? '').trim();
    const isBold = e[1] != null;
    const sp = index.speciesByLatin.get(normRef(inner));
    hits.push({
      start: e.index,
      end: e.index + e[0].length,
      text: inner,
      emphasis: isBold ? 'bold' : 'italic',
      ref: sp ? { kind: 'species', latin: sp.scientificName, label: inner } : undefined,
    });
  }

  // 3. Latin entre parenthèses
  const paren = /\(([A-Z][a-zé-]+(?:\s+[a-zé-]+){1,2})\)/g;
  let p: RegExpExecArray | null;
  while ((p = paren.exec(text))) {
    const sp = index.speciesByLatin.get(normRef(p[1]));
    if (sp) {
      hits.push({
        start: p.index + 1,
        end: p.index + 1 + p[1].length,
        text: p[1],
        emphasis: 'italic',
        ref: { kind: 'species', latin: sp.scientificName, label: p[1] },
      });
    }
  }

  // 4. « secteur D », « prélèvement B », « carotte A »
  const sample = /\b(secteurs?|pr[ée]l[èe]vements?|carottes?)\s+([A-Z])\b/g;
  let s: RegExpExecArray | null;
  while ((s = sample.exec(text))) {
    const found = index.sampleByLabel.get(normRef(s[2]));
    if (found) {
      hits.push({
        start: s.index,
        end: s.index + s[0].length,
        text: s[0],
        ref: { kind: 'sample', id: found.id, label: s[0] },
      });
    }
  }

  // 5. Noms exacts de zones, ouvrages et sondes du lieu
  for (const t of index.terms) {
    if (t.ref.kind === 'species') continue;
    addLiteral(t.ref.label, t.ref);
  }

  // 6. Noms d'espèces du lieu (français et latin) cités en clair
  for (const t of index.terms) {
    if (t.ref.kind !== 'species') continue;
    addLiteral(t.ref.label, t.ref);
    if (t.ref.latin) addLiteral(t.ref.latin, t.ref);
  }

  // Résolution des chevauchements : on garde le plus long, puis le plus à gauche
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: Hit[] = [];
  let cursor = -1;
  for (const h of hits) {
    if (h.start < cursor) continue;
    kept.push(h);
    cursor = h.end;
  }
  return kept;
}

/** Rend un texte d'action avec ses ressources cliquables. */
export function linkifyTourText(
  text: string | null | undefined,
  index: TourRefIndex,
  explicit: TourRef[] = [],
): React.ReactNode {
  const raw = text || '';
  if (!raw) return null;
  const hits = findHits(raw, index, explicit);
  if (!hits.length) return raw;

  const out: React.ReactNode[] = [];
  let last = 0;
  hits.forEach((h, i) => {
    if (h.start > last) out.push(raw.slice(last, h.start));
    const content =
      h.emphasis === 'bold' ? <strong>{h.text}</strong> : h.emphasis === 'italic' ? <em>{h.text}</em> : h.text;

    if (h.ref) {
      const ref = h.ref;
      out.push(
        <button
          key={`h${i}`}
          type="button"
          onClick={(ev) => {
            ev.stopPropagation();
            openTourRef(ref);
          }}
          className="inline-flex min-h-[24px] items-center gap-1 rounded px-0.5 text-left font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {KIND_ICON[ref.kind]}
          <span>{content}</span>
        </button>,
      );
    } else {
      out.push(<React.Fragment key={`h${i}`}>{content}</React.Fragment>);
    }
    last = h.end;
  });
  if (last < raw.length) out.push(raw.slice(last));
  return out;
}
