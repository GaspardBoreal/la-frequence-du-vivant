import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bot, Camera, Compass, Flower2, Footprints, LogIn, MessageCircle, Mic, PenLine, Search, Sprout, Users,
} from 'lucide-react';
import type { ParcoursEvent } from '@/hooks/admin/useMarcheurParcours';

const UNIVERS_META: Record<string, { label: string; dot: string; chip: string }> = {
  session: { label: 'Connexion', dot: 'bg-muted-foreground', chip: 'bg-muted text-muted-foreground' },
  marches: { label: 'Marches', dot: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-600' },
  jardin: { label: 'Jardin', dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-600' },
  contribution: { label: 'Contribution', dot: 'bg-sky-500', chip: 'bg-sky-500/10 text-sky-600' },
  assistant: { label: 'Assistant', dot: 'bg-violet-500', chip: 'bg-violet-500/10 text-violet-600' },
};

const KIND_ICON: Record<string, React.ElementType> = {
  session_start: LogIn,
  page_view: Compass,
  tab_switch: Compass,
  propriete_view: Sprout,
  media: Camera,
  media_upload: Camera,
  observation: Flower2,
  texte: PenLine,
  audio: Mic,
  participation: Users,
  recherche: Search,
  user: MessageCircle,
  assistant: Bot,
  feed_seen: Compass,
  feed_clicked: Compass,
  tool_use: Compass,
};

const KIND_LABEL: Record<string, string> = {
  session_start: 'Ouverture de session',
  page_view: 'Consultation',
  tab_switch: 'Changement d’onglet',
  propriete_view: 'Module du jardin',
  media: 'Photo déposée',
  media_upload: 'Photo déposée',
  observation: 'Observation',
  texte: 'Texte écrit',
  audio: 'Son enregistré',
  participation: 'Participation à une marche',
  recherche: 'Recherche',
  feed_seen: 'Fil parcouru',
  feed_clicked: 'Fil ouvert',
  tool_use: 'Outil utilisé',
  user: 'Question posée',
  assistant: 'Réponse de l’Assistant',
};

function lieu(e: ParcoursEvent) {
  return e.propriete_nom || e.event_nom || e.exploration_nom || null;
}

const AssistantBubble: React.FC<{ event: ParcoursEvent }> = ({ event }) => {
  const [ouvert, setOuvert] = useState(false);
  const question = event.kind === 'user';
  const texte = event.target ?? '';
  const court = texte.length > 220 && !ouvert ? `${texte.slice(0, 220)}…` : texte;
  const contexts = (event.metadata?.contexts as string[] | undefined) ?? [];

  return (
    <div
      className={`rounded-2xl border p-3 text-sm leading-relaxed ${
        question ? 'bg-muted/50 border-border' : 'bg-violet-500/5 border-violet-500/20'
      }`}
    >
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {question ? 'Question du marcheur' : 'Réponse de l’Assistant'}
      </p>
      <p className="whitespace-pre-wrap text-foreground">{court}</p>
      {texte.length > 220 && (
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          className="mt-2 min-h-[40px] text-xs font-medium text-primary underline underline-offset-4"
        >
          {ouvert ? 'Réduire' : 'Lire en entier'}
        </button>
      )}
      {contexts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {contexts.map((c) => (
            <span key={c} className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground border border-border">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const ParcoursTimeline: React.FC<{ events: ParcoursEvent[] }> = ({ events }) => {
  const jours = useMemo(() => {
    const map = new Map<string, ParcoursEvent[]>();
    for (const e of events) {
      const jour = e.at.slice(0, 10);
      const list = map.get(jour) ?? [];
      list.push(e);
      map.set(jour, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Aucune trace d’usage sur cette période.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {jours.map(([jour, liste]) => (
        <section key={jour}>
          <div className="sticky top-0 z-10 -mx-1 mb-2 bg-background/90 px-1 py-1 backdrop-blur">
            <h3 className="text-sm font-semibold text-foreground">
              {format(new Date(`${jour}T12:00:00`), 'EEEE d MMMM yyyy', { locale: fr })}
            </h3>
            <p className="text-xs text-muted-foreground">{liste.length} moment{liste.length > 1 ? 's' : ''}</p>
          </div>
          <ol className="relative space-y-3 border-l border-border pl-4">
            {liste
              .slice()
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .map((e, i) => {
                const meta = UNIVERS_META[e.univers] ?? UNIVERS_META.marches;
                const Icon = KIND_ICON[e.kind] ?? Footprints;
                const place = lieu(e);
                return (
                  <li key={`${e.at}-${i}`} className="relative">
                    <span className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {KIND_LABEL[e.kind] ?? e.kind}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.chip}`}>
                          {meta.label}
                        </span>
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                          {format(new Date(e.at), 'HH:mm')}
                        </span>
                      </div>
                      {e.univers === 'assistant' ? (
                        <div className="mt-2">
                          <AssistantBubble event={e} />
                        </div>
                      ) : (
                        (e.target || place) && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {e.target}
                            {place && <span className="text-foreground"> · {place}</span>}
                          </p>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
};

export default ParcoursTimeline;
