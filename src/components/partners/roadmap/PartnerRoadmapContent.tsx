import React from 'react';
import { Quote, CalendarDays, ClipboardCopy, Check } from 'lucide-react';
import type { PartnerRoadmap, RoadmapPriority, RoadmapTask, WorkStatus } from '@/lib/partnerRoadmaps';
import { priorityEffort } from '@/lib/partnerRoadmaps';
import { taskKey, buildLovablePrompt } from '@/lib/partnerRoadmaps/prompt';
import { useRoadmapTaskStatus } from '@/hooks/useRoadmapTaskStatus';
import { toast } from 'sonner';
import { SensorChainDiagram, NavigationShiftDiagram } from './RoadmapDiagrams';
import { EffortByPriorityChart, ThemeFamilyChart, SensorSampleChart } from './RoadmapCharts';
import { RoadmapTaskStatusControl, RoadmapProgressBar } from './RoadmapTaskStatusControl';

const SectionTitle: React.FC<{ index: string; title: string; lead?: string }> = ({
  index,
  title,
  lead,
}) => (
  <header className="mb-5">
    <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80">{index}</p>
    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
    {lead && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{lead}</p>}
  </header>
);

const TaskCard: React.FC<{
  roadmap: PartnerRoadmap;
  priority: RoadmapPriority;
  task: RoadmapTask;
  status: WorkStatus;
  themeLabel?: string;
  onStatus: (s: WorkStatus) => void;
}> = ({ roadmap, priority, task, status, themeLabel, onStatus }) => {
  const [copied, setCopied] = React.useState(false);

  const copyPrompt = async () => {
    const prompt = buildLovablePrompt(roadmap, priority, task);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copié', { description: task.title });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible', { description: 'Autorisez le presse-papiers.' });
    }
  };

  return (
    <div
      className={`group rounded-xl border p-4 transition-colors ${
        status === 'done'
          ? 'border-border/40 bg-background/20 opacity-75'
          : status === 'doing'
            ? 'border-amber-500/40 bg-amber-500/[0.04]'
            : 'border-border/50 bg-background/40'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4
          className={`text-sm font-semibold text-foreground ${
            status === 'done' ? 'line-through decoration-border decoration-1' : ''
          }`}
        >
          {task.title}
        </h4>
        <RoadmapTaskStatusControl value={status} onChange={onStatus} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{task.detail}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="uppercase tracking-wide text-muted-foreground/70">Produit&nbsp;:</span>{' '}
        {task.output}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-border/60 px-2 py-0.5">{task.effortDays} j</span>
        {themeLabel && (
          <span className="rounded-full border border-border/60 px-2 py-0.5">{themeLabel}</span>
        )}
        <button
          type="button"
          onClick={copyPrompt}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20 print:hidden"
        >
          {copied ? <Check className="h-3 w-3" /> : <ClipboardCopy className="h-3 w-3" />}
          {copied ? 'Prompt copié' : 'Copier le prompt'}
        </button>
      </div>
    </div>
  );
};

export const PartnerRoadmapContent: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => {
  const themeById = React.useMemo(
    () => new Map(roadmap.themes.map((t) => [t.id, t])),
    [roadmap.themes],
  );
  const { resolve, setStatus } = useRoadmapTaskStatus(roadmap.slug, roadmap.date);
  const totalTasks = roadmap.priorities.reduce((s, p) => s + p.tasks.length, 0);
  const totalDays = roadmap.priorities.reduce((s, p) => s + priorityEffort(p.tasks), 0);

  const counts = React.useMemo(() => {
    const c = { done: 0, doing: 0, todo: 0 };
    roadmap.priorities.forEach((p) =>
      p.tasks.forEach((t) => {
        c[resolve(p.code, taskKey(t.title), t.status)] += 1;
      }),
    );
    return c;
  }, [roadmap.priorities, resolve]);
  

  /** Filtre d'avancement de la section « Les chantiers ». */
  const [filter, setFilter] = React.useState<WorkStatus | 'all'>('all');
  /**
   * Chantiers dont l'état vient d'être changé : ils restent visibles dans une liste
   * filtrée jusqu'au prochain changement de filtre, pour ne pas perdre le focus.
   */
  const [pinned, setPinned] = React.useState<Set<string>>(() => new Set());

  const changeStatus = React.useCallback(
    (code: string, key: string, s: WorkStatus) => {
      setPinned((prev) => new Set(prev).add(`${code}:${key}`));
      setStatus(code, key, s);
    },
    [setStatus],
  );

  const applyFilter = (f: WorkStatus | 'all') => {
    setPinned(new Set());
    setFilter(f);
    document.getElementById('roadmap-03')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const FILTERS: { id: WorkStatus | 'all'; label: string; n: number }[] = [
    { id: 'all', label: 'Tous', n: totalTasks },
    { id: 'done', label: 'Faits', n: counts.done },
    { id: 'doing', label: 'En cours', n: counts.doing },
    { id: 'todo', label: 'À faire', n: counts.todo },
  ];




  return (
    <div className="space-y-16">
      {/* Synthèse chiffrée — les trois états mènent d'un clic à la liste filtrée */}
      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sujets relevés</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{roadmap.themes.length}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Charge estimée</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{Math.round(totalDays)} j</p>
        </div>
        {FILTERS.filter((f) => f.id !== 'all').map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => applyFilter(f.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              filter === f.id
                ? 'border-primary/60 bg-primary/10'
                : 'border-border/60 bg-card/50 hover:border-primary/40'
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Chantiers {f.label.toLowerCase()}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {f.n}
              <span className="text-sm font-normal text-muted-foreground">/{totalTasks}</span>
            </p>
          </button>
        ))}
      </section>


      {/* 1 — Ce qui est ressorti */}
      <section id="roadmap-01" className="scroll-mt-32">
        <SectionTitle
          index="01"
          title="Ce qui est ressorti de l'entretien"
          lead="Chaque sujet est repris tel qu'il a été formulé, avec l'extrait de l'échange qui le porte."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {roadmap.themes.map((t) => {
            const quote = roadmap.verbatims.find((v) => v.themeId === t.id);
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{t.label}</h3>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                    {t.family}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{t.summary}</p>
                {quote && (
                  <blockquote className="mt-4 flex gap-2 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                    <span>
                      « {quote.quote} »
                      <span className="ml-1 not-italic text-xs text-muted-foreground/70">
                        — {quote.speaker}, {quote.at}
                      </span>
                    </span>
                  </blockquote>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* 2 — Lecture d'ensemble */}
      <section id="roadmap-02" className="scroll-mt-32">
        <SectionTitle
          index="02"
          title="Lecture d'ensemble"
          lead="Répartition de la charge par priorité et des sujets par famille."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="mb-3 text-sm font-medium text-foreground">Charge estimée par priorité (jours)</p>
            <EffortByPriorityChart roadmap={roadmap} />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="mb-3 text-sm font-medium text-foreground">Familles de sujets</p>
            <ThemeFamilyChart roadmap={roadmap} />
          </div>
        </div>

        {/* Frise */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/40 p-5">
          <p className="mb-4 text-sm font-medium text-foreground">
            Frise de priorisation — août à octobre 2026
          </p>
          <div className="space-y-2.5">
            {roadmap.priorities.map((p, i) => (
              <div key={p.code} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-xs font-semibold text-primary">{p.code}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted/40">
                  <div
                    className="absolute inset-y-0 rounded-md bg-primary/70"
                    style={{
                      left: `${p.startPct}%`,
                      width: `${p.widthPct}%`,
                      opacity: 1 - i * 0.09,
                    }}
                  />
                </div>
                <span className="hidden w-40 shrink-0 text-right text-[11px] text-muted-foreground sm:block">
                  {p.window}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
            <span>Août 2026</span>
            <span>Septembre 2026</span>
            <span>Octobre 2026</span>
          </div>
        </div>
      </section>

      {/* 3 — Les chantiers */}
      <section id="roadmap-03" className="scroll-mt-32">
        <SectionTitle
          index="03"
          title="Les chantiers, par ordre de priorité"
          lead="Pour chaque chantier : ce que l'on construit, ce que cela produit, la charge estimée et l'état d'avancement."
        />

        {/* Filtre d'avancement, collant sous le sommaire */}
        <div className="sticky top-[96px] z-10 -mx-2 mb-6 rounded-full border border-border/50 bg-background/90 px-2 py-1.5 backdrop-blur print:hidden">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => applyFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {f.label}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {f.n}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {roadmap.priorities.map((p) => {
            const done = p.tasks.filter(
              (t) => resolve(p.code, taskKey(t.title), t.status) === 'done',
            ).length;
            const visibleTasks = p.tasks.filter((t) => {
              if (filter === 'all') return true;
              const key = taskKey(t.title);
              if (pinned.has(`${p.code}:${key}`)) return true;
              return resolve(p.code, key, t.status) === filter;
            });
            if (visibleTasks.length === 0) return null;
            return (
            <article key={p.code} className="rounded-2xl border border-border/60 bg-card/30 p-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {p.code}
                </span>
                <h3 className="text-xl font-semibold text-foreground">{p.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {p.window} · {priorityEffort(p.tasks)} j ·{' '}
                  {filter === 'all'
                    ? `${p.tasks.length} chantiers`
                    : `${visibleTasks.length} sur ${p.tasks.length} chantiers`}
                </span>
                <span className="ml-auto">
                  <RoadmapProgressBar
                    done={done}
                    total={p.tasks.length}
                    label={`${done}/${p.tasks.length} chantiers livrés`}
                  />
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm italic text-muted-foreground">{p.rationale}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {visibleTasks.map((t) => {
                  const key = taskKey(t.title);
                  return (
                    <TaskCard
                      key={t.title}
                      roadmap={roadmap}
                      priority={p}
                      task={t}
                      status={resolve(p.code, key, t.status)}
                      themeLabel={t.themeId ? themeById.get(t.themeId)?.label : undefined}
                      onStatus={(s) => changeStatus(p.code, key, s)}
                    />
                  );
                })}
              </div>



              {p.code === 'P3' && (
                <div className="mt-6 space-y-5">
                  <div className="rounded-xl border border-border/50 bg-background/40 p-5 text-muted-foreground">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      Chaîne de la donnée capteurs
                    </p>
                    <SensorChainDiagram />
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/40 p-5">
                    <p className="mb-1 text-sm font-medium text-foreground">
                      Restitution cible : écart sol / air sur 7 jours
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Exemple de lecture : l'air oscille de 19 à 31 °C quand le sol à 60 cm ne bouge
                      que de 0,6 °C — c'est cette inertie que les sondes rendent visible.
                    </p>
                    <SensorSampleChart roadmap={roadmap} />
                  </div>
                </div>
              )}

              {p.code === 'P4' && (
                <div className="mt-6 rounded-xl border border-border/50 bg-background/40 p-5 text-muted-foreground">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Reconfiguration de la navigation
                  </p>
                  <NavigationShiftDiagram />
                </div>
              )}
            </article>
            );
          })}

        </div>
      </section>

      {/* 4 — Planning */}
      <section id="roadmap-04" className="scroll-mt-32">
        <SectionTitle index="04" title="Planning" lead="Jalons de livraison retenus." />
        <ol className="relative space-y-5 border-l border-border/60 pl-6">
          {roadmap.milestones.map((m) => (
            <li key={m.date} className="relative">
              <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border border-primary/50 bg-background">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary/70" />
                  {m.date}
                </span>
                <span className="text-sm text-primary">{m.label}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5 — Verbatims complets */}
      <section id="roadmap-05" className="scroll-mt-32">
        <SectionTitle
          index="05"
          title="Extraits de l'entretien"
          lead="Les passages sur lesquels s'appuie cette feuille de route, dans l'ordre de l'échange."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {roadmap.verbatims.map((v) => (
            <blockquote
              key={`${v.at}-${v.themeId}`}
              className="rounded-xl border border-border/50 bg-card/30 p-4 text-sm"
            >
              <p className="italic text-foreground/85">« {v.quote} »</p>
              <footer className="mt-2 text-xs text-muted-foreground">
                {v.speaker} · {v.at} · {themeById.get(v.themeId)?.label}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <p className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm leading-relaxed text-foreground/90">
        {roadmap.closing}
      </p>
    </div>
  );
};

export default PartnerRoadmapContent;
