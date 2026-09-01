import React, { useEffect, useMemo, useState } from 'react';
import {
  Mic, Loader2, Sparkles, Check, X, Pencil, Trash2, Plus, Quote, ShieldAlert, Clock,
  Upload, FileText,
} from 'lucide-react';
import { useDocumentExtractor } from '@/hooks/useDocumentExtractor';
import { toast } from 'sonner';
import {
  REGISTRES, REGISTRE_LABELS, REGISTRE_HINTS,
  useProprieteEntretiens, useEntretienExtraits, useCreateEntretien, useDeleteEntretien,
  useHarvestEntretien, useUpdateExtrait,
  type Entretien, type EntretienExtrait, type Registre,
} from '@/hooks/propriete/useProprieteEntretiens';
import { useCanEditIntention } from '@/hooks/propriete/usePropertyIntention';

/**
 * L'Entretien fondateur — l'interview d'initialisation devient un objet vivant
 * du jardin : on la dépose, l'IA propose des cartes, la propriétaire valide.
 * Rien n'est appliqué sans un clic ; chaque carte porte sa phrase exacte.
 */

interface Props {
  proprieteId: string;
  proprieteNom: string;
}

const SOURCES = [
  { value: 'texte', label: 'Texte collé' },
  { value: 'pdf', label: 'Transcription PDF' },
  { value: 'audio', label: 'Audio transcrit' },
];

export const PortraitEntretiens: React.FC<Props> = ({ proprieteId, proprieteNom }) => {
  const { data: entretiens = [], isLoading } = useProprieteEntretiens(proprieteId);
  const { data: canEdit = false } = useCanEditIntention(proprieteId);
  const [openForm, setOpenForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => entretiens.find((e) => e.id === selectedId) ?? entretiens[0] ?? null,
    [entretiens, selectedId],
  );

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-serif italic text-foreground flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-600" />
            L'entretien fondateur
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl mt-1">
            L'entretien d'initialisation de {proprieteNom} devient la matière du jardin :
            faits du lieu, gestes, lignes rouges, cap. L'IA propose, vous décidez — carte par carte.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setOpenForm((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Déposer un entretien
          </button>
        )}
      </header>

      {openForm && canEdit && (
        <EntretienForm
          proprieteId={proprieteId}
          onDone={(id) => { setOpenForm(false); setSelectedId(id); }}
          onCancel={() => setOpenForm(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des entretiens…
        </div>
      ) : entretiens.length === 0 ? (
        !openForm && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Aucun entretien déposé. Collez la transcription de l'entretien d'initialisation :
              elle pré-remplira le dossier du jardin et fixera vos lignes rouges.
            </p>
          </div>
        )
      ) : (
        <>
          {entretiens.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {entretiens.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
                    selected?.id === e.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {e.titre}
                </button>
              ))}
            </div>
          )}
          {selected && (
            <EntretienDetail proprieteId={proprieteId} entretien={selected} canEdit={canEdit} />
          )}
        </>
      )}
    </div>
  );
};

/* ── Dépôt ──────────────────────────────────────────────────────────────── */

const EntretienForm: React.FC<{
  proprieteId: string;
  onDone: (id: string) => void;
  onCancel: () => void;
}> = ({ proprieteId, onDone, onCancel }) => {
  const create = useCreateEntretien(proprieteId);
  const [titre, setTitre] = useState(DEFAULT_TITRE);
  const [tenuLe, setTenuLe] = useState('');
  const [source, setSource] = useState('texte');
  const [transcript, setTranscript] = useState('');
  const [consentement, setConsentement] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const {
    document: extracted, isExtracting, error: extractError,
    fileInputRef, processFile, removeDocument, openFilePicker, acceptedFormats,
  } = useDocumentExtractor({ maxLength: 400_000 });

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    await processFile(file);
  };

  useEffect(() => {
    if (!extracted) return;
    setTranscript(extracted.text);
    setSource(extracted.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'texte');
    setTitre((t) => (t === DEFAULT_TITRE ? extracted.fileName.replace(/\.[^.]+$/, '') : t));
  }, [extracted]);


  const submit = async () => {
    if (transcript.trim().length < 200) {
      toast.error('La transcription est trop courte pour être exploitée.');
      return;
    }
    try {
      const e = await create.mutateAsync({
        titre: titre.trim() || 'Entretien',
        tenu_le: tenuLe || null,
        source,
        transcript: transcript.trim(),
        consentement,
      });
      toast.success('Entretien déposé.');
      onDone(e.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dépôt impossible');
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted-foreground space-y-1 sm:col-span-2">
          Titre de l'entretien
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-xs text-muted-foreground space-y-1">
          Tenu le
          <input
            type="date"
            value={tenuLe}
            onChange={(e) => setTenuLe(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSource(s.value)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              source === s.value ? 'bg-muted border-amber-500 text-foreground' : 'border-border text-muted-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label className="text-xs text-muted-foreground space-y-1 block">
        Transcription
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={10}
          placeholder="Collez ici la transcription complète de l'entretien…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono"
        />
      </label>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={consentement}
          onChange={(e) => setConsentement(e.target.checked)}
          className="mt-0.5"
        />
        La personne interviewée a donné son accord pour l'enregistrement et l'exploitation de cet entretien.
      </label>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">
          Annuler
        </button>
        <button
          onClick={submit}
          disabled={create.isPending}
          className="text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Déposer
        </button>
      </div>
    </div>
  );
};

/* ── Détail + récolte ───────────────────────────────────────────────────── */

const EntretienDetail: React.FC<{
  proprieteId: string;
  entretien: Entretien;
  canEdit: boolean;
}> = ({ proprieteId, entretien, canEdit }) => {
  const { data: extraits = [], isLoading } = useEntretienExtraits(entretien.id);
  const harvest = useHarvestEntretien(proprieteId);
  const remove = useDeleteEntretien(proprieteId);
  const [showTranscript, setShowTranscript] = useState(false);

  const aValider = extraits.filter((e) => e.statut === 'propose').length;
  const acceptes = extraits.filter((e) => e.statut === 'accepte').length;

  const run = async () => {
    try {
      const n = await harvest.mutateAsync({ entretienId: entretien.id });
      toast.success(n > 0 ? `${n} cartes proposées.` : 'Aucune carte fiable extraite.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Récolte indisponible');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card/60 p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="text-sm">
          <div className="font-medium text-foreground">{entretien.titre}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            {entretien.tenu_le && <span>{new Date(entretien.tenu_le).toLocaleDateString('fr-FR')}</span>}
            <span>· {(entretien.transcript ?? '').length.toLocaleString('fr-FR')} signes</span>
            {acceptes > 0 && <span>· {acceptes} cartes validées</span>}
            {aValider > 0 && <span className="text-amber-600">· {aValider} à valider</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted"
          >
            {showTranscript ? 'Masquer' : 'Lire'} la transcription
          </button>
          {canEdit && (
            <>
              <button
                onClick={run}
                disabled={harvest.isPending}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 disabled:opacity-60"
              >
                {harvest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {extraits.length ? 'Relancer la récolte' : 'Récolter'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Supprimer cet entretien et ses cartes ?')) remove.mutate(entretien.id);
                }}
                className="text-xs px-2.5 py-1.5 rounded-full border border-border hover:bg-destructive/10 text-muted-foreground"
                title="Supprimer l'entretien"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {showTranscript && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
          {entretien.transcript}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des cartes…
        </div>
      ) : extraits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Lancez la récolte : l'IA relit l'entretien et propose des cartes, chacune avec sa phrase exacte.
        </div>
      ) : (
        REGISTRES.map((r) => {
          const cards = extraits.filter((e) => e.registre === r && e.statut !== 'ecarte');
          const ecartees = extraits.filter((e) => e.registre === r && e.statut === 'ecarte');
          if (cards.length === 0 && ecartees.length === 0) return null;
          return (
            <RegistreBloc
              key={r}
              registre={r}
              cards={cards}
              ecarteesCount={ecartees.length}
              proprieteId={proprieteId}
              entretienId={entretien.id}
              canEdit={canEdit}
            />
          );
        })
      )}
    </div>
  );
};

/* ── Registre ───────────────────────────────────────────────────────────── */

const RegistreBloc: React.FC<{
  registre: Registre;
  cards: EntretienExtrait[];
  ecarteesCount: number;
  proprieteId: string;
  entretienId: string;
  canEdit: boolean;
}> = ({ registre, cards, ecarteesCount, proprieteId, entretienId, canEdit }) => {
  const rouge = registre === 'ligne_rouge';
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <h3 className={`text-sm font-medium flex items-center gap-1.5 ${rouge ? 'text-destructive' : 'text-foreground'}`}>
          {rouge && <ShieldAlert className="w-4 h-4" />}
          {REGISTRE_LABELS[registre]}
        </h3>
        <span className="text-xs text-muted-foreground">{REGISTRE_HINTS[registre]}</span>
        {ecarteesCount > 0 && (
          <span className="text-[11px] text-muted-foreground/70">({ecarteesCount} écartée{ecarteesCount > 1 ? 's' : ''})</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <ExtraitCard
            key={c.id}
            extrait={c}
            proprieteId={proprieteId}
            entretienId={entretienId}
            canEdit={canEdit}
            rouge={rouge}
          />
        ))}
      </div>
    </section>
  );
};

/* ── Carte ──────────────────────────────────────────────────────────────── */

const ExtraitCard: React.FC<{
  extrait: EntretienExtrait;
  proprieteId: string;
  entretienId: string;
  canEdit: boolean;
  rouge: boolean;
}> = ({ extrait, proprieteId, entretienId, canEdit, rouge }) => {
  const update = useUpdateExtrait(proprieteId);
  const [editing, setEditing] = useState(false);
  const [titre, setTitre] = useState(extrait.titre);
  const [detail, setDetail] = useState(extrait.detail ?? '');

  const accepte = extrait.statut === 'accepte';

  const decide = (statut: 'accepte' | 'ecarte') =>
    update.mutate({ id: extrait.id, entretienId, patch: { statut } });

  const saveEdit = () => {
    update.mutate(
      { id: extrait.id, entretienId, patch: { titre: titre.trim() || extrait.titre, detail, statut: 'accepte' } },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <article
      className={`rounded-2xl border p-4 space-y-2.5 transition-colors ${
        accepte
          ? rouge
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-emerald-600/40 bg-emerald-600/5'
          : 'border-border bg-card/60'
      }`}
    >
      {editing ? (
        <>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
          />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
          />
        </>
      ) : (
        <>
          <h4 className="text-sm font-medium text-foreground">{extrait.titre}</h4>
          {extrait.detail && <p className="text-xs text-muted-foreground leading-relaxed">{extrait.detail}</p>}
        </>
      )}

      {extrait.verbatim && (
        <blockquote className="text-xs italic text-foreground/80 border-l-2 border-amber-500/60 pl-2.5 flex gap-1.5">
          <Quote className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
          <span>
            « {extrait.verbatim} »
            {extrait.minutage && (
              <span className="not-italic text-muted-foreground ml-1 inline-flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {extrait.minutage}
              </span>
            )}
          </span>
        </blockquote>
      )}

      {canEdit && (
        <div className="flex items-center gap-1.5 pt-0.5">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Enregistrer
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => decide('accepte')}
                disabled={accepte}
                className={`text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  accepte ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-400' : 'bg-emerald-600 text-white'
                }`}
              >
                <Check className="w-3 h-3" /> {accepte ? 'Validée' : 'Accepter'}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> Ajuster
              </button>
              <button
                onClick={() => decide('ecarte')}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Écarter
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
};
