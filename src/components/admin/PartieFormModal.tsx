import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { ROMAN_NUMERALS } from '@/hooks/useExplorationParties';
import type { ExplorationPartie } from '@/types/exploration';
import { Loader2, Palette } from 'lucide-react';

interface PartieFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partie?: ExplorationPartie | null;
  onSubmit: (data: {
    titre: string;
    sousTitre?: string;
    numeroRomain: string;
    couleur: string;
    description?: string;
  }) => void;
  isSubmitting?: boolean;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const PartieFormModal: React.FC<PartieFormModalProps> = ({
  open,
  onOpenChange,
  partie,
  onSubmit,
  isSubmitting = false,
}) => {
  const [titre, setTitre] = useState('');
  const [sousTitre, setSousTitre] = useState('');
  const [numeroRomain, setNumeroRomain] = useState('I');
  const [couleur, setCouleur] = useState('#6366f1');
  const [description, setDescription] = useState('');

  // Reset form when modal opens/closes or partie changes
  useEffect(() => {
    if (open) {
      if (partie) {
        setTitre(partie.titre);
        setSousTitre(partie.sous_titre || '');
        setNumeroRomain(partie.numero_romain);
        setCouleur(partie.couleur || '#6366f1');
        setDescription(partie.description || '');
      } else {
        setTitre('');
        setSousTitre('');
        setNumeroRomain('I');
        setCouleur('#6366f1');
        setDescription('');
      }
    }
  }, [open, partie]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    onSubmit({
      titre: titre.trim(),
      sousTitre: sousTitre.trim() || undefined,
      numeroRomain,
      couleur,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gaspard-background border-gaspard-primary/20">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gaspard-primary text-xl">
              {partie ? 'Modifier la partie' : 'Nouvelle partie'}
            </DialogTitle>
            <DialogDescription className="text-gaspard-muted">
              Structurez votre recueil en mouvements littéraires
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Numéro romain */}
            <div className="space-y-2">
              <Label htmlFor="numero" className="text-gaspard-text text-sm font-medium">
                Numéro
              </Label>
              <Select value={numeroRomain} onValueChange={setNumeroRomain}>
                <SelectTrigger className="w-24 border-gaspard-primary/20 bg-gaspard-background/50 text-gaspard-text focus:border-gaspard-primary focus:ring-gaspard-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gaspard-card border-gaspard-primary/20">
                  {ROMAN_NUMERALS.map((num) => (
                    <SelectItem key={num} value={num} className="text-gaspard-text hover:bg-gaspard-primary/10">
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Titre principal */}
            <div className="space-y-2">
              <Label htmlFor="titre" className="text-gaspard-text text-sm font-medium">
                Titre principal <span className="text-red-400">*</span>
              </Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="LE CONTRE-COURANT"
                className="border-gaspard-primary/20 bg-gaspard-background/50 text-gaspard-text placeholder:text-gaspard-muted/50 uppercase font-semibold tracking-wide focus:border-gaspard-primary focus:ring-gaspard-primary/20"
                required
              />
            </div>

            {/* Sous-titre */}
            <div className="space-y-2">
              <Label htmlFor="sousTitre" className="text-gaspard-text text-sm font-medium">
                Sous-titre <span className="text-gaspard-muted text-xs">(optionnel)</span>
              </Label>
              <Input
                id="sousTitre"
                value={sousTitre}
                onChange={(e) => setSousTitre(e.target.value)}
                placeholder="L'Observation"
                className="border-gaspard-primary/20 bg-gaspard-background/50 text-gaspard-text placeholder:text-gaspard-muted/50 italic focus:border-gaspard-primary focus:ring-gaspard-primary/20"
              />
            </div>

            {/* Couleur */}
            <div className="space-y-3">
              <Label className="text-gaspard-text text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4 text-gaspard-muted" />
                Couleur d'accent
              </Label>
              <div className="flex flex-wrap gap-3 p-3 bg-gaspard-background/30 rounded-lg border border-gaspard-primary/10">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCouleur(color)}
                    className={`w-7 h-7 rounded-full transition-all duration-200 shadow-sm ${
                      couleur === color
                        ? 'ring-2 ring-offset-2 ring-offset-gaspard-card ring-white/60 scale-110 shadow-lg'
                        : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Couleur ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gaspard-text text-sm font-medium">
                Notes internes <span className="text-gaspard-muted text-xs">(non publiées)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes sur le choix de cette structure..."
                className="border-gaspard-primary/20 bg-gaspard-background/50 text-gaspard-text placeholder:text-gaspard-muted/50 min-h-[80px] resize-none focus:border-gaspard-primary focus:ring-gaspard-primary/20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!titre.trim() || isSubmitting}
              className="bg-gradient-to-r from-gaspard-primary to-gaspard-secondary hover:from-gaspard-primary/90 hover:to-gaspard-secondary/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {partie ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartieFormModal;
