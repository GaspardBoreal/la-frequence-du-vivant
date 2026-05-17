import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDuplicateExploration } from '@/hooks/useDuplicateExploration';

interface DuplicateExplorationDialogProps {
  source: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfter?: boolean;
}

export const DuplicateExplorationDialog: React.FC<DuplicateExplorationDialogProps> = ({
  source,
  open,
  onOpenChange,
  redirectAfter = true,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const { mutate, isPending } = useDuplicateExploration();

  useEffect(() => {
    if (source && open) {
      setTitle(`${source.name} (copie)`);
    }
  }, [source, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error('Le titre doit contenir au moins 2 caractères');
      return;
    }
    mutate(
      { sourceId: source.id, newName: trimmed },
      {
        onSuccess: (newId) => {
          toast.success('Exploration dupliquée');
          onOpenChange(false);
          if (redirectAfter) {
            navigate(`/admin/explorations/${newId}/edit`);
          }
        },
        onError: (err: any) => {
          console.error('Duplicate exploration error:', err);
          toast.error(err?.message ?? 'Erreur lors de la duplication');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Dupliquer cette exploration
            </DialogTitle>
            <DialogDescription>
              Crée une copie de la coquille éditoriale. Les marches existantes restent partagées.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-title">Titre de la copie</Label>
              <Input
                id="duplicate-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={isPending}
                autoFocus
              />
            </div>

            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-2">
              <div>
                <span className="font-medium text-foreground">Copié :</span>
                <ul className="mt-1 ml-4 list-disc text-muted-foreground space-y-0.5">
                  <li>Infos de base (description, type, couverture, SEO…)</li>
                  <li>Pages de l'exploration</li>
                  <li>Liste des marches associées (en brouillon)</li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-foreground">Non copié :</span>
                <ul className="mt-1 ml-4 list-disc text-muted-foreground space-y-0.5">
                  <li>Mouvements littéraires (à recréer si besoin)</li>
                  <li>Statut publié (la copie démarre dépubliée)</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || title.trim().length < 2}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Duplication…
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateExplorationDialog;
