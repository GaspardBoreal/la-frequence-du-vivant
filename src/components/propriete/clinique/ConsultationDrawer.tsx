import React from 'react';
import { motion } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Camera, CheckCircle2, Circle, Sprout, ShieldCheck, Microscope,
  CalendarClock, CloudRain, Clock, Award, Pencil, Trash2, Check, X, Maximize2,
} from 'lucide-react';
import {
  useConsultationDetail, useToggleAction, useAddConsultationMedia, useUpdateConsultation,
  useDeleteConsultation,
  type Consultation, type CareAction, type ConsultationMedia,
} from '@/hooks/propriete/useGardenClinique';
import JournalViewer from '@/components/propriete/clinique/JournalViewer';
import { JournalTimeline, BeforeAfterCurtain } from '@/components/propriete/clinique/JournalTimeline';



const STATUS_LABEL: Record<string, string> = {
  observation: 'En observation',
  traitement: 'En traitement',
  gueri: 'Rétabli',
  perdu: 'Sujet perdu',
};

const INTENSITY_LABEL = ['', 'Observer', 'Geste de main', 'Préparation douce', 'Préparation renforcée', 'Intervention forte'];

const ActionRow: React.FC<{ action: CareAction; onToggle: () => void }> = ({ action, onToggle }) => (
  <motion.li
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    className={`rounded-2xl border p-3 transition ${
      action.done
        ? 'border-[hsl(var(--ds-forest))]/45 bg-[hsl(var(--ds-forest))]/[0.07]'
        : 'border-[hsl(var(--ds-line))] bg-white/60'
    }`}
  >
    <div className="flex items-start gap-3">
      <button type="button" onClick={onToggle} aria-label={action.done ? 'Marquer à faire' : 'Marquer fait'}>
        {action.done
          ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-[hsl(var(--ds-forest))]" />
          : <Circle className="mt-0.5 h-5 w-5 text-[hsl(var(--ds-forest))]/40" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[hsl(var(--ds-forest-deep))] px-2 py-0.5 text-[9px] uppercase tracking-widest text-[hsl(var(--ds-cream))]">
            {INTENSITY_LABEL[action.intensity] || `Intensité ${action.intensity}`}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest-deep))]/80">
            {action.volet === 'preventif' ? <ShieldCheck className="h-3 w-3" /> : <Sprout className="h-3 w-3" />}
            {action.volet === 'preventif' ? 'Préventif' : 'Curatif'}
          </span>
          <span aria-hidden className="ml-auto flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`h-1.5 w-3 rounded-full ${
                  i <= action.intensity ? 'bg-[hsl(var(--ds-gold))]' : 'bg-[hsl(var(--ds-line))]'
                }`}
              />
            ))}
          </span>
        </div>
        <p className={`mt-1 text-sm font-medium text-[hsl(var(--ds-forest-deep))] ${action.done ? 'line-through opacity-70' : ''}`}>
          {action.label}
        </p>
        {action.detail && (
          <p className="mt-0.5 text-xs leading-relaxed text-[hsl(var(--ds-forest))]/80">{action.detail}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-[hsl(var(--ds-forest-deep))]/80">
          {action.frequency && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{action.frequency}</span>
          )}
          {action.weather_caution && (
            <span className="inline-flex items-center gap-1"><CloudRain className="h-3 w-3" />{action.weather_caution}</span>
          )}
        </div>
      </div>
    </div>
  </motion.li>
);

export const ConsultationDrawer: React.FC<{
  consultation: Consultation | null;
  proprieteId: string;
  onClose: () => void;
}> = ({ consultation, proprieteId, onClose }) => {
  const { data, isLoading } = useConsultationDetail(consultation?.id);
  const toggle = useToggleAction(proprieteId);
  const addMedia = useAddConsultationMedia(proprieteId);
  const update = useUpdateConsultation(proprieteId);
  const remove = useDeleteConsultation(proprieteId);
  const [uploading, setUploading] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [draftLabel, setDraftLabel] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setRenaming(false);
    setConfirmDelete(false);
    setViewerIndex(null);
    setDraftLabel(consultation?.subject_label ?? '');
  }, [consultation?.id, consultation?.subject_label]);


  const actions = data?.actions ?? [];
  const medias = React.useMemo<ConsultationMedia[]>(() => data?.medias ?? [], [data?.medias]);
  const doneCount = actions.filter((a) => a.done).length;
  const progress = actions.length ? Math.round((doneCount / actions.length) * 100) : 0;

  const onPinNote = React.useCallback(
    (m: ConsultationMedia) => {
      if (!consultation) return;
      const when = new Date(m.taken_at ?? m.created_at).toLocaleString('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      const line = `Repère du ${when}${m.severity_at_capture ? ` · étendue ${m.severity_at_capture}/5` : ''}`;
      const notes = consultation.notes ? `${consultation.notes}\n${line}` : line;
      update.mutate({ id: consultation.id, patch: { notes } });
    },
    [consultation, update],
  );


  const onJournalPick = async (list: FileList | null) => {
    if (!list?.length || !consultation) return;
    setUploading(true);
    try {
      for (const f of Array.from(list).slice(0, 4)) {
        const type = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'photo';
        await addMedia.mutateAsync({
          consultationId: consultation.id,
          file: f,
          mediaType: type as 'photo' | 'video' | 'audio',
          severity: consultation.severity,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={!!consultation} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[hsl(var(--ds-cream))] border-l border-[hsl(var(--ds-line))]"
      >
        {consultation && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-start gap-2">
                {renaming ? (
                  <form
                    className="flex flex-1 flex-wrap items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const label = draftLabel.trim();
                      if (!label || label === consultation.subject_label) { setRenaming(false); return; }
                      update.mutate(
                        { id: consultation.id, patch: { subject_label: label } },
                        { onSuccess: () => setRenaming(false) },
                      );
                    }}
                  >
                    <input
                      autoFocus
                      value={draftLabel}
                      onChange={(e) => setDraftLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setRenaming(false); }}
                      className="min-w-0 flex-1 rounded-xl border border-[hsl(var(--ds-forest))]/40 bg-white/80 px-3 py-1.5 font-serif italic text-xl text-[hsl(var(--ds-forest-deep))] outline-none placeholder:text-[hsl(var(--ds-forest-deep))]/40 focus:border-[hsl(var(--ds-forest))]"
                      placeholder="Le sujet observé"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[hsl(var(--ds-forest))] px-3 py-1.5 text-[11px] text-[hsl(var(--ds-cream))] hover:bg-[hsl(var(--ds-forest-deep))]"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenaming(false)}
                      className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-3 py-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:bg-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <SheetTitle className="flex-1 font-serif italic text-2xl text-[hsl(var(--ds-forest-deep))]">
                      {consultation.subject_label}
                    </SheetTitle>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title="Renommer le sujet"
                        aria-label="Renommer le sujet"
                        onClick={() => { setDraftLabel(consultation.subject_label); setRenaming(true); }}
                        className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 p-2 text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest))]/50 hover:bg-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Supprimer la consultation"
                        aria-label="Supprimer la consultation"
                        onClick={() => setConfirmDelete(true)}
                        className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 p-2 text-[hsl(4_68%_42%)] transition hover:border-[hsl(4_68%_48%)]/60 hover:bg-[hsl(4_68%_48%)]/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <SheetDescription className="text-[hsl(var(--ds-forest-deep))]/80">
                {consultation.organ ? `${consultation.organ} · ` : ''}
                {STATUS_LABEL[consultation.status]} · ouverte le{' '}
                {new Date(consultation.opened_at).toLocaleDateString('fr-FR')}
              </SheetDescription>
            </SheetHeader>

            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-2xl border border-[hsl(4_68%_48%)]/40 bg-[hsl(4_68%_48%)]/[0.07] p-3"
              >
                <p className="text-sm text-[hsl(var(--ds-forest-deep))]">
                  Effacer définitivement cette consultation ? Les hypothèses, les gestes et les
                  photos du journal partiront avec elle.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(consultation.id, { onSuccess: onClose })}
                    className="rounded-full bg-[hsl(4_68%_44%)] px-3 py-1.5 text-[11px] text-[hsl(var(--ds-cream))] transition hover:bg-[hsl(4_68%_38%)] disabled:opacity-60"
                  >
                    {remove.isPending ? 'Effacement…' : 'Oui, effacer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-3 py-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:bg-white"
                  >
                    Garder au registre
                  </button>
                </div>
              </motion.div>
            )}


            {/* Statut */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(['observation', 'traitement', 'gueri', 'perdu'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update.mutate({
                    id: consultation.id,
                    patch: { status: s, closed_at: s === 'gueri' || s === 'perdu' ? new Date().toISOString() : null } as any,
                  })}
                  className={`rounded-full border px-3 py-1 text-[11px] transition ${
                    consultation.status === s
                      ? 'border-transparent bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                      : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {isLoading && (
              <p className="mt-6 animate-pulse text-sm text-[hsl(var(--ds-forest-deep))]/80">Lecture du dossier…</p>
            )}

            {/* Hypothèses */}
            {!!data?.hypotheses.length && (
              <section className="mt-6">
                <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                  <Microscope className="h-3 w-3" /> Hypothèses croisées
                </h4>
                <div className="mt-2 space-y-2">
                  {data.hypotheses.map((h, i) => (
                    <motion.article
                      key={h.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-2xl border p-3 ${
                        i === 0
                          ? 'border-[hsl(var(--ds-gold))]/60 bg-white/75'
                          : 'border-[hsl(var(--ds-line))] bg-white/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[hsl(var(--ds-forest-deep))]">{h.common_name}</p>
                          {h.scientific_name && (
                            <p className="text-[11px] italic text-[hsl(var(--ds-forest-deep))]/80">{h.scientific_name}</p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-[hsl(var(--ds-forest))]/10 px-2 py-0.5 text-[10px] text-[hsl(var(--ds-forest-deep))]">
                          confiance {Math.round((h.confidence || 0) * 100)} %
                        </span>
                      </div>
                      {h.what_you_see && (
                        <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--ds-forest-deep))]">
                          <span className="font-semibold">Ce qui se voit — </span>{h.what_you_see}
                        </p>
                      )}
                      {h.terrain_reading && (
                        <p className="mt-1.5 rounded-xl bg-[hsl(var(--ds-forest))]/[0.06] p-2 text-xs italic leading-relaxed text-[hsl(var(--ds-forest-deep))]">
                          {h.terrain_reading}
                        </p>
                      )}
                      {h.confusions && (
                        <p className="mt-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">
                          <span className="font-semibold">À ne pas confondre — </span>{h.confusions}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => update.mutate({ id: consultation.id, patch: { retained_hypothesis_id: h.id } as any })}
                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] transition ${
                          consultation.retained_hypothesis_id === h.id
                            ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                            : 'border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50'
                        }`}
                      >
                        <Award className="h-3 w-3" />
                        {consultation.retained_hypothesis_id === h.id ? 'Hypothèse retenue' : 'Retenir'}
                      </button>
                    </motion.article>
                  ))}
                </div>
              </section>
            )}

            {/* Prescription */}
            {!!actions.length && (
              <section className="mt-6">
                <div className="flex items-end justify-between">
                  <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                    <CalendarClock className="h-3 w-3" /> Prescription vivante
                  </h4>
                  <span className="text-[11px] text-[hsl(var(--ds-forest-deep))]/80">{doneCount}/{actions.length} gestes</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--ds-line))]">
                  <motion.div
                    className="h-full rounded-full bg-[hsl(var(--ds-forest))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 70, damping: 18 }}
                  />
                </div>
                <ul className="mt-3 space-y-2">
                  {actions.map((a) => (
                    <ActionRow
                      key={a.id}
                      action={a}
                      onToggle={() => toggle.mutate({ action: a, consultationId: consultation.id })}
                    />
                  ))}
                </ul>
              </section>
            )}

            {/* Journal */}
            <section className="mt-6 pb-10">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
                Journal de rétablissement
              </h4>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[hsl(var(--ds-forest))]/40 bg-white/50 py-4 text-xs text-[hsl(var(--ds-forest))]/80 transition hover:bg-white/80">
                <Camera className="h-4 w-4" />
                {uploading ? 'Enregistrement…' : 'Ajouter une photo, une vidéo ou un vocal daté'}
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={(e) => onJournalPick(e.target.files)}
                />
              </label>

              {!!medias.length && (
                <>
                  <BeforeAfterCurtain medias={medias} />
                  <JournalTimeline
                    medias={medias}
                    actions={actions}
                    activeIndex={viewerIndex}
                    onPick={setViewerIndex}
                  />

                  <ol className="mt-3 space-y-3 border-l border-[hsl(var(--ds-line))] pl-4">
                    {medias.map((m, i) => (
                      <li key={m.id} className="relative">
                        <span aria-hidden className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-[hsl(var(--ds-gold))]" />
                        <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/65">
                          {m.taken_at ? new Date(m.taken_at).toLocaleString('fr-FR') : '—'}
                          {m.severity_at_capture ? ` · étendue ${m.severity_at_capture}/5` : ''}
                        </p>
                        {m.media_type === 'photo' ? (
                          <button
                            type="button"
                            onClick={() => setViewerIndex(i)}
                            className="group relative mt-1 block overflow-hidden rounded-xl border border-[hsl(var(--ds-line))]"
                            aria-label="Ouvrir en grand"
                          >
                            <img src={m.url} alt={m.caption ?? ''} loading="lazy" className="max-h-56 object-cover transition duration-500 group-hover:scale-[1.03]" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                              <Maximize2 className="h-5 w-5 text-white" />
                            </span>
                          </button>
                        ) : m.media_type === 'video' ? (
                          <button
                            type="button"
                            onClick={() => setViewerIndex(i)}
                            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2 text-xs font-medium text-[hsl(var(--ds-forest-deep))] transition hover:bg-white"
                          >
                            <Maximize2 className="h-4 w-4" /> Lire la vidéo en grand
                          </button>
                        ) : (
                          <audio src={m.url} controls className="mt-1 w-full" />
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>

            <JournalViewer
              medias={medias}
              index={viewerIndex}
              onNavigate={setViewerIndex}
              onClose={() => setViewerIndex(null)}
              onPinNote={onPinNote}
            />

          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ConsultationDrawer;
