import React from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { PHASE_LABEL, type MediaPhase } from '@/lib/chantierIcg';

const PHASES: MediaPhase[] = ['avant', 'pendant', 'apres'];

interface Ouvrage {
  id: string;
  label: string;
}

/**
 * « Le versoir » — on dépose les photographies du chantier sans quitter
 * l'écran : on choisit l'ouvrage, on choisit la phase, on verse.
 * Les images rejoignent le carnet photo de l'ouvrage et sont rangées
 * d'emblée dans la bonne phase.
 */
export const ChantierPhotoIntake: React.FC<{
  ouvrages: Ouvrage[];
  busy?: boolean;
  progress?: { done: number; total: number } | null;
  onUpload: (objetId: string, phase: MediaPhase, files: File[]) => void;
}> = ({ ouvrages, busy, progress, onUpload }) => {
  const [objetId, setObjetId] = React.useState(ouvrages[0]?.id ?? '');
  const [phase, setPhase] = React.useState<MediaPhase>('avant');
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const camRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!ouvrages.some((o) => o.id === objetId)) setObjetId(ouvrages[0]?.id ?? '');
  }, [ouvrages, objetId]);

  const send = (files: FileList | null) => {
    if (!files?.length || !objetId) return;
    onUpload(objetId, phase, Array.from(files));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        send(e.dataTransfer.files);
      }}
      className={`mb-3 rounded-xl border border-dashed p-3 transition ${
        over ? 'border-[#c8a24a] bg-[#c8a24a]/10' : 'border-current/20 bg-white/[0.02]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] opacity-55">
          Verser des photographies
        </span>

        {ouvrages.length > 1 && (
          <select
            value={objetId}
            onChange={(e) => setObjetId(e.target.value)}
            className="rounded-full border border-current/20 bg-transparent px-2.5 py-1 text-[11px]"
          >
            {ouvrages.map((o) => (
              <option key={o.id} value={o.id} className="text-black">
                {o.label}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-1">
          {PHASES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPhase(p)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                phase === p
                  ? 'border-[#c8a24a] bg-[#c8a24a]/15'
                  : 'border-current/20 opacity-70 hover:opacity-100'
              }`}
            >
              {PHASE_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            disabled={busy || !objetId}
            onClick={() => camRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2.5 py-1 text-[11px] disabled:opacity-40 sm:hidden"
          >
            <Camera className="h-3 w-3" /> Photo
          </button>
          <button
            type="button"
            disabled={busy || !objetId}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-full border border-[#c8a24a] bg-[#c8a24a]/15 px-3 py-1 text-[11px] font-medium disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ImagePlus className="h-3 w-3" />
            )}
            {busy && progress
              ? `${progress.done}/${progress.total}`
              : 'Choisir des images'}
          </button>
        </div>
      </div>

      <p className="mt-1.5 text-[11px] italic opacity-55">
        Glissez-déposez ici, ou choisissez : les images rejoignent le carnet de l'ouvrage et
        sont rangées en « {PHASE_LABEL[phase]} ». La date EXIF reste la référence du récit.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          send(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          send(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default ChantierPhotoIntake;
