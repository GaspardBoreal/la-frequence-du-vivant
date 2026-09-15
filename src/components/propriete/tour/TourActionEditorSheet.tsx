import React from 'react';
import { Check, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GardenSchema, SCHEMA_KEYS, SCHEMA_LABELS, type SchemaKey } from './GardenSchema';
import { TOUR_VOLETS, type TourAction, type TourVolet } from '@/hooks/propriete/useProprieteTours';

interface Props {
  action: TourAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<TourAction>) => Promise<void> | void;
}

export const TourActionEditorSheet: React.FC<Props> = ({ action, open, onOpenChange, onSave }) => {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({
    titre: action.titre,
    detail: action.detail ?? '',
    volet: action.volet,
    moment: action.moment ?? '',
    schema_key: action.schema_key ?? '',
  });

  React.useEffect(() => {
    if (!open) return;
    setDraft({
      titre: action.titre,
      detail: action.detail ?? '',
      volet: action.volet,
      moment: action.moment ?? '',
      schema_key: action.schema_key ?? '',
    });
    setError(null);
  }, [action, open]);

  const save = async () => {
    if (!draft.titre.trim()) {
      setError("Donnez un titre à l'action avant de l'enregistrer.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(action.id, {
        titre: draft.titre.trim(),
        detail: draft.detail.trim() || null,
        volet: draft.volet,
        moment: draft.moment.trim() || null,
        schema_key: draft.schema_key || null,
      });
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L'action n'a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/25" aria-hidden />
        <SheetHeader className="border-b border-border px-5 pb-4 pt-3 text-left">
          <SheetTitle>Modifier l'action</SheetTitle>
          <SheetDescription>Précisez le geste, le bon moment et son intention.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 touch-pan-y">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Titre</span>
            <Input
              value={draft.titre}
              onChange={(event) => setDraft((current) => ({ ...current, titre: event.target.value }))}
              placeholder="Titre de l'action"
              autoFocus
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Comment faire, et pourquoi</span>
            <Textarea
              value={draft.detail}
              onChange={(event) => setDraft((current) => ({ ...current, detail: event.target.value }))}
              placeholder="Décrivez le geste en quelques lignes…"
              rows={5}
              className="resize-none leading-relaxed"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Intention</span>
              <Select
                value={draft.volet}
                onValueChange={(value) => setDraft((current) => ({ ...current, volet: value as TourVolet }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[1300] bg-popover">
                  {TOUR_VOLETS.map((volet) => (
                    <SelectItem key={volet.value} value={volet.value}>{volet.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Moment conseillé</span>
              <span className="relative block">
                <Clock3 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={draft.moment}
                  onChange={(event) => setDraft((current) => ({ ...current, moment: event.target.value }))}
                  placeholder="Par exemple : matin frais"
                  className="pl-9"
                />
              </span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Croquis associé</span>
            <Select
              value={draft.schema_key || 'none'}
              onValueChange={(value) => setDraft((current) => ({
                ...current,
                schema_key: value === 'none' ? '' : value,
              }))}
            >
              <SelectTrigger><SelectValue placeholder="Aucun croquis" /></SelectTrigger>
              <SelectContent className="z-[1300] bg-popover">
                <SelectItem value="none">Aucun croquis</SelectItem>
                {SCHEMA_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>{SCHEMA_LABELS[key as SchemaKey]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {draft.schema_key && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <GardenSchema schemaKey={draft.schema_key} className="mx-auto max-w-[280px]" />
            </div>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:flex sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={saving || !draft.titre.trim()}>
            <Check className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TourActionEditorSheet;