import { ExternalLink } from 'lucide-react';
import type { Source } from '@/content/iaFrugale/outilsMesure';

interface Props {
  sources: Source[];
  titre?: string;
}

export const SourceNote = ({ sources, titre = 'Sources' }: Props) => (
  <div className="space-y-1.5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {titre}
    </p>
    <ul className="space-y-1.5">
      {sources.map((s) => (
        <li key={s.url} className="text-xs leading-relaxed text-muted-foreground">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            <span>{s.label}</span>
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          </a>
          <span className="ml-1 opacity-70">— consulté le {s.consulteLe}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default SourceNote;
