import React from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TOUR_STATUTS, type TourStatut } from '@/hooks/propriete/useProprieteTours';

interface Props {
  onCreate: (input: {
    titre: string;
    date_tour: string;
    intention?: string | null;
    statut?: TourStatut;
    duree_min?: number | null;
  }) => Promise<unknown>;
}

export const NewTourDialog: React.FC<Props> = ({ onCreate }) => {
  const [open, setOpen] = React.useState(false);
  const [titre, setTitre] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [intention, setIntention] = React.useState('');
  const [statut, setStatut] = React.useState<TourStatut>('planifie');
  const [duree, setDuree] = React.useState('60');

  const submit = async () => {
    if (!titre.trim()) return;
    await onCreate({
      titre: titre.trim(),
      date_tour: date,
      intention: intention.trim() || null,
      statut,
      duree_min: Number(duree) || null,
    });
    setOpen(false);
    setTitre('');
    setIntention('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau tour
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Nouveau tour de jardin</DialogTitle>
          <DialogDescription>
            Un tour de jardin est une sortie d'observation, avec ses gestes à poser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tour-titre">Titre</Label>
            <Input
              id="tour-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Tour de septembre"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="tour-date">Date</Label>
              <Input id="tour-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tour-duree">Durée (min)</Label>
              <Input id="tour-duree" type="number" min={10} step={10} value={duree} onChange={(e) => setDuree(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as TourStatut)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {TOUR_STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tour-intention">Intention</Label>
            <Textarea
              id="tour-intention"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              rows={2}
              placeholder="Ce que je veux regarder de près cette fois-ci"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!titre.trim()}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTourDialog;
