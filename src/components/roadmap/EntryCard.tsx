import React from 'react';
import { Badge } from '@/components/ui/badge';
import ScreenshotFrame from './ScreenshotFrame';
import {
  AUDIENCES,
  pitchFor,
  type RoadmapAudience,
  type RoadmapEntry,
  type RoadmapMedia,
} from '@/lib/roadmap/types';

interface Props {
  entry: RoadmapEntry;
  audience: RoadmapAudience | null;
  onOpenMedia?: (media: RoadmapMedia) => void;
}

/** Une nouveauté : promesse, preuve en images, publics concernés. */
const EntryCard: React.FC<Props> = ({ entry, audience, onOpenMedia }) => {
  const pitch = pitchFor(entry, audience);
  const medias = entry.medias ?? [];

  return (
    <article className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur transition hover:border-primary/40 hover:shadow-md">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold leading-snug text-foreground">{entry.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {entry.domain && (
            <Badge variant="secondary" className="text-[11px]">{entry.domain}</Badge>
          )}
          {!audience &&
            entry.audiences.map((a) => (
              <Badge key={a} variant="outline" className="text-[11px]">
                {AUDIENCES.find((x) => x.key === a)?.label ?? a}
              </Badge>
            ))}
        </div>
      </header>

      {pitch && <p className="text-sm leading-relaxed text-muted-foreground">{pitch}</p>}
      {entry.body && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
          {entry.body}
        </p>
      )}

      {medias.length > 0 && (
        <div
          className={`mt-4 grid gap-3 ${medias.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}
        >
          {medias.map((m) => (
            <ScreenshotFrame key={m.id} media={m} onOpen={onOpenMedia} />
          ))}
        </div>
      )}
    </article>
  );
};

export default EntryCard;
