import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AUDIENCES, weekRangeLabel, type RoadmapAudience, type RoadmapEntry, type RoadmapWeek } from '@/lib/roadmap/types';

interface Props {
  week: RoadmapWeek;
  entries: RoadmapEntry[];
  audience: RoadmapAudience | null;
  index: number;
}

/** Une « saison » de la frise : la semaine, son titre, sa densité par public. */
const WeekCard: React.FC<Props> = ({ week, entries, audience, index }) => {
  const counts = AUDIENCES.map((a) => ({
    ...a,
    n: entries.filter((e) => e.audiences.includes(a.key)).length,
  }));
  const cover = week.cover_url ?? entries.find((e) => e.medias?.length)?.medias?.[0]?.public_url;

  return (
    <Link
      to={`/roadmap/semaine/${week.iso_year}/${week.iso_week}${audience ? `?public=${audience}` : ''}`}
      className="group block overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl animate-fade-in"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {cover && (
        <div className="h-36 overflow-hidden bg-muted">
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Semaine {week.iso_week} · {week.iso_year}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground">
          {week.title || `Semaine ${week.iso_week}`}
        </h3>
        <p className="text-xs text-muted-foreground">{weekRangeLabel(week)}</p>
        {week.narrative && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{week.narrative}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {counts
            .filter((c) => c.n > 0)
            .map((c) => (
              <Badge
                key={c.key}
                variant={audience === c.key ? 'default' : 'secondary'}
                className="text-[11px]"
              >
                {c.label} · {c.n}
              </Badge>
            ))}
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
            Lire l’édition <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default WeekCard;
