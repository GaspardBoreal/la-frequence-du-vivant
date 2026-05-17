import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDuplicateMarcheEvent } from '@/hooks/useDuplicateMarcheEvent';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: { id: string; title: string; date_marche: string } | null;
  /** If true, redirect to edit page after duplication. Default: true */
  redirectAfter?: boolean;
}

const DuplicateEventDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  source,
  redirectAfter = true,
}) => {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useDuplicateMarcheEvent();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('10:00');

  // Reset form when source changes
  useEffect(() => {
    if (source && open) {
      setTitle(`${source.title} (copie)`);
      const base = new Date(source.date_marche);
      const newDate = addDays(base, 7);
      setDate(newDate);
      setTime(format(base, 'HH:mm'));
    }
  }, [source, open]);

  const handleSubmit = async () => {
    if (!source) return;
    if (!title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }
    if (!date) {
      toast.error('La date est obligatoire');
      return;
    }

    const [h, m] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(h || 0, m || 0, 0, 0);

    try {
      const newId = await mutateAsync({
        sourceId: source.id,
        title: title.trim(),
        dateMarche: dt.toISOString(),
      });
      toast.success('Événement dupliqué');
      onOpenChange(false);
      if (redirectAfter) navigate(`/admin/marche-events/${newId}`);
    } catch (err: any) {
      console.error('[DuplicateEventDialog] failed', err);
      toast.error('Échec de la duplication', { description: err?.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            Dupliquer l'événement
          </DialogTitle>
          <DialogDescription>
            Crée une copie indépendante. Les participations, médias, observations
            et témoignages ne sont <strong>pas</strong> recopiés. Un nouveau
            QR code est généré automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dup-title">Titre de la copie</Label>
            <Input
              id="dup-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-2">
              <Label>Nouvelle date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: fr }) : 'Choisir'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={fr}
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dup-time">Heure</Label>
              <Input
                id="dup-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isPending}
                className="w-[110px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
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
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateEventDialog;
