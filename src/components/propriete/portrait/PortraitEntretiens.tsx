import React, { useEffect, useMemo, useState } from 'react';
import {
  Mic, Loader2, Sparkles, Check, X, Pencil, Trash2, Plus, Quote, ShieldAlert, Clock,
  Upload, FileText, Lock, History, RotateCcw, BadgeCheck,
} from 'lucide-react';
import { useDocumentExtractor } from '@/hooks/useDocumentExtractor';
import { toast } from 'sonner';
import {
  REGISTRES, REGISTRE_LABELS, REGISTRE_HINTS, isEntretienVerrouille,
  useProprieteEntretiens, useEntretienExtraits, useCreateEntretien, useDeleteEntretien,
  useHarvestEntretien, useUpdateExtrait,
  useValiderEntretien, useRouvrirEntretien, useReviserExtrait, useExtraitVersions,
  type Entretien, type EntretienExtrait, type Registre,
} from '@/hooks/propriete/useProprieteEntretiens';
import { useCanEditIntention } from '@/hooks/propriete/usePropertyIntention';
import { ConnaissanceJardinCard } from './ConnaissanceJardinCard';

/**
 * L'Entretien fondateur — l'interview d'initialisation devient un objet vivant
 * du jardin : on la dépose, l'IA propose des cartes, la propriétaire valide.
 * Rien n'est appliqué sans un clic ; chaque carte porte sa phrase exacte.
 */

interface Props {
  proprieteId: string;
  proprieteNom: string;
}

const DEFAULT_TITRE = 'ITW 01 · Découverte du jardin';

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

      <ConnaissanceJardinCard proprieteId={proprieteId} />


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
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-xl border border-dashed px-4 py-4 text-center transition-colors ${
          dragOver ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-background/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        {isExtracting ? (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Lecture du document…
          </div>
        ) : extracted ? (
          <div className="flex items-center justify-center gap-2 text-xs text-foreground flex-wrap">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">{extracted.fileName}</span>
            <span className="text-muted-foreground">
              · {extracted.text.length.toLocaleString('fr-FR')} signes extraits
            </span>
            <button
              onClick={() => { removeDocument(); setTranscript(''); }}
              className="ml-1 text-muted-foreground hover:text-foreground underline"
            >
              retirer
            </button>
          </div>
        ) : (
          <button
            onClick={openFilePicker}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-3.5 h-3.5" />
            Importer un fichier (PDF, TXT, MD, CSV) — ou glissez-le ici
          </button>
        )}
        {extractError && (
          <p className="mt-2 text-xs text-destructive">
            {extractError} Vous pouvez coller la transcription manuellement.
          </p>
        )}
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
  const valider = useValiderEntretien(proprieteId);
  const rouvrir = useRouvrirEntretien(proprieteId);
  const [showTranscript, setShowTranscript] = useState(false);
  const [askValidation, setAskValidation] = useState(false);

  const verrouille = isEntretienVerrouille(entretien);
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

  const reopen = async () => {
    const motif = window.prompt(
      "Rouvrir cet entretien ? Les points reviennent en relecture et sortent de la base de connaissance du jardin.\n\nMotif de la réouverture :",
    );
    if (motif === null) return;
    try {
      await rouvrir.mutateAsync({ entretienId: entretien.id, motif });
      toast.success('Entretien rouvert. La version validée reste consultable dans l’historique.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Réouverture impossible');
    }
  };

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border p-4 flex flex-wrap items-center gap-3 justify-between ${
          verrouille ? 'border-emerald-700/40 bg-emerald-600/[0.06]' : 'border-border bg-card/60'
        }`}
      >
        <div className="text-sm">
          <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
            {entretien.titre}
            {verrouille && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Validé · verrouillé
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
            {entretien.tenu_le && <span>{new Date(entretien.tenu_le).toLocaleDateString('fr-FR')}</span>}
            <span>· {(entretien.transcript ?? '').length.toLocaleString('fr-FR')} signes</span>
            {acceptes > 0 && <span>· {acceptes} cartes acceptées</span>}
            {aValider > 0 && !verrouille && <span className="text-amber-600">· {aValider} à relire</span>}
            {verrouille && entretien.validated_at && (
              <span className="text-emerald-700 dark:text-emerald-400">
                · validé le {new Date(entretien.validated_at).toLocaleDateString('fr-FR')}
                {entretien.validated_with ? ` avec ${entretien.validated_with}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted"
          >
            {showTranscript ? 'Masquer' : 'Lire'} la transcription
          </button>
          {canEdit && !verrouille && (
            <>
              <button
                onClick={run}
                disabled={harvest.isPending}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 disabled:opacity-60"
              >
                {harvest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {extraits.length ? 'Relancer la récolte' : 'Récolter'}
              </button>
              {acceptes > 0 && (
                <button
                  onClick={() => setAskValidation(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
                >
                  <BadgeCheck className="w-3.5 h-3.5" /> Valider l'entretien
                </button>
              )}
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
          {canEdit && verrouille && (
            <button
              onClick={reopen}
              disabled={rouvrir.isPending}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted text-muted-foreground flex items-center gap-1.5 disabled:opacity-60"
            >
              {rouvrir.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Rouvrir
            </button>
          )}
        </div>
      </div>

      {verrouille && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
          Ces points font autorité pour l'IA de Jardin, le Tour de jardin et vos trois premiers gestes.
          Une correction reste possible, mais elle est motivée, datée et conservée dans l'historique.
        </p>
      )}

      {askValidation && (
        <ValidationDialog
          entretien={entretien}
          extraits={extraits}
          aValider={aValider}
          isPending={valider.isPending}
          onCancel={() => setAskValidation(false)}
          onConfirm={async (validatedWith, tenuLe) => {
            try {
              const n = await valider.mutateAsync({ entretienId: entretien.id, validatedWith, tenuLe });
              setAskValidation(false);
              toast.success(`${n} points sont entrés dans la base de connaissance du jardin.`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Validation impossible');
            }
          }}
        />
      )}

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
              verrouille={verrouille}
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
  verrouille: boolean;
}> = ({ registre, cards, ecarteesCount, proprieteId, entretienId, canEdit, verrouille }) => {
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
            verrouille={verrouille}
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
  verrouille: boolean;
}> = ({ extrait, proprieteId, entretienId, canEdit, rouge, verrouille }) => {
  const update = useUpdateExtrait(proprieteId);
  const reviser = useReviserExtrait(proprieteId);
  const [editing, setEditing] = useState(false);
  const [titre, setTitre] = useState(extrait.titre);
  const [detail, setDetail] = useState(extrait.detail ?? '');
  const [motif, setMotif] = useState('');
  const [showHistorique, setShowHistorique] = useState(false);
  const { data: versions = [] } = useExtraitVersions(extrait.id, showHistorique);

  const accepte = extrait.statut === 'accepte';

  const decide = (statut: 'accepte' | 'ecarte') =>
    update.mutate({ id: extrait.id, entretienId, patch: { statut } });

  const openEdit = () => {
    setTitre(extrait.titre);
    setDetail(extrait.detail ?? '');
    setMotif('');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (verrouille) {
      if (!motif.trim()) {
        toast.error('Indiquez le motif de la correction : il sera conservé dans l’historique.');
        return;
      }
      try {
        await reviser.mutateAsync({ id: extrait.id, entretienId, titre, detail, motif });
        setEditing(false);
        toast.success('Correction enregistrée. L’ancienne version reste consultable.');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Correction impossible');
      }
      return;
    }
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
          {verrouille && (
            <input
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif de la correction (obligatoire)"
              className="w-full rounded-lg border border-amber-500/50 bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
          )}
        </>
      ) : (
        <>
          <h4 className="text-sm font-medium text-foreground flex items-start gap-1.5">
            {verrouille && accepte && (
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            )}
            <span>{extrait.titre}</span>
          </h4>
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

      {showHistorique && (
        <div className="rounded-xl border border-border bg-muted/30 p-2.5 space-y-2">
          <div className="text-[11px] font-medium text-foreground">Historique des versions</div>
          {versions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Aucune correction depuis la validation.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="text-[11px] text-muted-foreground border-l-2 border-border pl-2">
                <div className="text-foreground">{v.titre}</div>
                {v.detail && <div>{v.detail}</div>}
                <div className="mt-0.5">
                  {new Date(v.created_at).toLocaleString('fr-FR')}
                  {v.motif ? ` · ${v.motif}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {canEdit && (
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={reviser.isPending}
                className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1 disabled:opacity-60"
              >
                <Check className="w-3 h-3" /> {verrouille ? 'Enregistrer la correction' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border"
              >
                Annuler
              </button>
            </>
          ) : verrouille ? (
            <>
              <button
                onClick={openEdit}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" /> Corriger
              </button>
              <button
                onClick={() => setShowHistorique((v) => !v)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground flex items-center gap-1"
              >
                <History className="w-3 h-3" /> Historique
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
                <Check className="w-3 h-3" /> {accepte ? 'Acceptée' : 'Accepter'}
              </button>
              <button
                onClick={openEdit}
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

/* ── Validation de l'entretien ──────────────────────────────────────────── */

const ValidationDialog: React.FC<{
  entretien: Entretien;
  extraits: EntretienExtrait[];
  aValider: number;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (validatedWith: string, tenuLe: string | null) => void;
}> = ({ entretien, extraits, aValider, isPending, onCancel, onConfirm }) => {
  const [avec, setAvec] = useState(entretien.validated_with ?? '');
  const [tenuLe, setTenuLe] = useState(entretien.tenu_le ?? '');

  const acceptes = extraits.filter((e) => e.statut === 'accepte');
  const lignesRouges = acceptes.filter((e) => e.registre === 'ligne_rouge');

  return (
    <div
      className="fixed inset-0 z-[1200] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card p-5 space-y-4"
      >
        <h3 className="text-lg font-serif italic text-foreground flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          Valider l'entretien
        </h3>
        <p className="text-xs text-muted-foreground">
          Ces points entreront dans la base de connaissance du jardin et seront verrouillés.
          Ils guideront l'IA de Jardin, le Tour de jardin et vos trois premiers gestes.
        </p>

        {aValider > 0 && (
          <p className="text-xs text-amber-600 border border-amber-500/40 bg-amber-500/10 rounded-xl p-2.5">
            Il reste {aValider} carte{aValider > 1 ? 's' : ''} à accepter ou à écarter avant de pouvoir valider.
          </p>
        )}

        <ul className="text-xs text-muted-foreground space-y-1">
          {REGISTRES.map((r) => {
            const n = acceptes.filter((e) => e.registre === r).length;
            if (n === 0) return null;
            return (
              <li key={r}>
                <span className="text-foreground">{REGISTRE_LABELS[r]}</span> · {n}
              </li>
            );
          })}
        </ul>

        {lignesRouges.length > 0 && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 space-y-1">
            <div className="text-xs font-medium text-destructive flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Ce que nous ne proposerons jamais
            </div>
            {lignesRouges.map((l) => (
              <div key={l.id} className="text-xs text-foreground">• {l.titre}</div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground space-y-1">
            Relu avec
            <input
              value={avec}
              onChange={(e) => setAvec(e.target.value)}
              placeholder="Prénom de la personne"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-muted-foreground space-y-1">
            Date de l'entretien
            <input
              type="date"
              value={tenuLe}
              onChange={(e) => setTenuLe(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(avec, tenuLe || null)}
            disabled={isPending || aValider > 0 || acceptes.length === 0}
            className="text-xs px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Valider et verrouiller
          </button>
        </div>
      </div>
    </div>
  );
};
