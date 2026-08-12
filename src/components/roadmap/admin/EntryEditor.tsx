import React from 'react';
import { Trash2, Plus, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useRoadmapAdmin, useRoadmapMedia } from '@/hooks/roadmap/useRoadmap';
import { AUDIENCES, type RoadmapAudience, type RoadmapEntry } from '@/lib/roadmap/types';

interface Props {
  entry: RoadmapEntry;
}

/** Édition d'une nouveauté : promesse, pitches par public, illustrations. */
const EntryEditor: React.FC<Props> = ({ entry }) => {
  const { saveEntry, deleteEntry, setEntryMedia, uploadMedia } = useRoadmapAdmin();
  const { data: library = [] } = useRoadmapMedia();
  const [local, setLocal] = React.useState(entry);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [showLibrary, setShowLibrary] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setLocal(entry), [entry]);

  const set = <K extends keyof RoadmapEntry>(k: K, v: RoadmapEntry[K]) =>
    setLocal((p) => ({ ...p, [k]: v }));

  const toggleAudience = (a: RoadmapAudience) =>
    set(
      'audiences',
      local.audiences.includes(a)
        ? local.audiences.filter((x) => x !== a)
        : [...local.audiences, a],
    );

  const save = async () => {
    const { medias, ...payload } = local as any;
    await saveEntry.mutateAsync(payload);
    toast.success('Nouveauté enregistrée');
  };

  const attach = async (mediaId: string) => {
    const ids = [...(local.medias ?? []).map((m) => m.id), mediaId];
    await setEntryMedia.mutateAsync({ entryId: entry.id, mediaIds: Array.from(new Set(ids)) });
    setShowLibrary(false);
  };

  const detach = async (mediaId: string) => {
    const ids = (local.medias ?? []).map((m) => m.id).filter((id) => id !== mediaId);
    await setEntryMedia.mutateAsync({ entryId: entry.id, mediaIds: ids });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const media: any = await uploadMedia.mutateAsync({ file, kind: 'capture' });
      if (media?.id) await attach(media.id);
      toast.success('Capture ajoutée');
    } catch (err: any) {
      toast.error(err?.message ?? 'Envoi impossible');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <article className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-start gap-2">
        <Input
          value={local.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Titre de la nouveauté"
          className="font-medium"
        />
        <Input
          value={local.domain ?? ''}
          onChange={(e) => set('domain', e.target.value)}
          placeholder="Domaine"
          className="max-w-[180px]"
        />
        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Textarea
        value={local.promise ?? ''}
        onChange={(e) => set('promise', e.target.value)}
        placeholder="La promesse en une phrase"
        rows={2}
      />
      <Textarea
        value={local.body ?? ''}
        onChange={(e) => set('body', e.target.value)}
        placeholder="Le détail (optionnel)"
        rows={3}
      />

      <div className="flex flex-wrap gap-2">
        {AUDIENCES.map((a) => (
          <Button
            key={a.key}
            type="button"
            size="sm"
            variant={local.audiences.includes(a.key) ? 'default' : 'outline'}
            onClick={() => toggleAudience(a.key)}
          >
            {a.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Textarea
          value={local.pitch_marcheur ?? ''}
          onChange={(e) => set('pitch_marcheur', e.target.value)}
          placeholder="Pitch marcheurs"
          rows={3}
        />
        <Textarea
          value={local.pitch_proprietaire ?? ''}
          onChange={(e) => set('pitch_proprietaire', e.target.value)}
          placeholder="Pitch propriétaires"
          rows={3}
        />
        <Textarea
          value={local.pitch_partenaire ?? ''}
          onChange={(e) => set('pitch_partenaire', e.target.value)}
          placeholder="Pitch partenaires"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Ajouter une capture
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowLibrary((s) => !s)}>
            <ImageIcon className="mr-2 h-4 w-4" /> Médiathèque
          </Button>
          <Button size="sm" className="ml-auto" onClick={save} disabled={saveEntry.isPending}>
            Enregistrer
          </Button>
        </div>

        {(local.medias ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(local.medias ?? []).map((m) => (
              <div key={m.id} className="relative">
                <img
                  src={m.public_url}
                  alt={m.caption ?? ''}
                  className="h-20 w-32 rounded-md border border-border/60 object-cover"
                />
                <button
                  onClick={() => detach(m.id)}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  aria-label="Retirer l’image"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showLibrary && (
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-border/60 p-2">
            {library.map((m) => (
              <button key={m.id} onClick={() => attach(m.id)} className="group">
                <img
                  src={m.public_url}
                  alt=""
                  className="h-16 w-full rounded object-cover transition group-hover:ring-2 group-hover:ring-primary"
                />
              </button>
            ))}
            {library.length === 0 && (
              <p className="col-span-4 py-4 text-center text-xs text-muted-foreground">
                Médiathèque vide.
              </p>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette nouveauté ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {local.title} » sera retirée de l’édition. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEntry.mutate(entry.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

export default EntryEditor;
