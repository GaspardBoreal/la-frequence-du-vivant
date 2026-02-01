import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, Loader2, CheckCircle, Users, Calendar, MapPin, 
  Leaf, Headphones, Brain, Sparkles, Building2, Phone, Mail, User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ContactFormB2BProps {
  formationId?: string;
  source?: string;
  className?: string;
}

// Options d'expériences
const experiences = [
  { 
    id: 'bioacoustique', 
    label: 'Bioacoustique & Écoute', 
    icon: Headphones,
    description: 'Immersion sonore dans le vivant'
  },
  { 
    id: 'biodiversite', 
    label: 'Biodiversité & Data', 
    icon: Leaf,
    description: 'Science participative terrain'
  },
  { 
    id: 'leadership', 
    label: 'Leadership & Cohésion', 
    icon: Users,
    description: 'Team building immersif'
  },
  { 
    id: 'ia-recits', 
    label: 'IA & Nouveaux Récits', 
    icon: Brain,
    description: 'Créativité prospective'
  },
];

// Tailles de groupe
const taillesGroupe = [
  { value: '5-10', label: '5-10 personnes' },
  { value: '10-20', label: '10-20 personnes' },
  { value: '20-50', label: '20-50 personnes' },
  { value: '50+', label: '50+ personnes' },
];

// Durées
const durees = [
  { value: 'demi-journee', label: '½ journée' },
  { value: 'journee', label: '1 journée' },
  { value: 'seminaire', label: '2-3 jours' },
];

const ContactFormB2B: React.FC<ContactFormB2BProps> = ({ 
  formationId,
  source = 'marches-du-vivant',
  className = '' 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    fonction: '',
    entreprise: '',
    telephone: '',
    email: '',
    tailleGroupe: '',
    duree: '',
    experiences: [] as string[],
    datesSouhaitees: '',
    lieuPrefere: '',
    objectifs: '',
    budgetQualiopi: false,
  });

  const handleExperienceToggle = (experienceId: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.includes(experienceId)
        ? prev.experiences.filter(e => e !== experienceId)
        : [...prev.experiences, experienceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.entreprise || !formData.telephone || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.experiences.length === 0) {
      toast.error('Veuillez sélectionner au moins une expérience');
      return;
    }

    setIsSubmitting(true);

    try {
      // Pour l'instant, on simule l'envoi
      // TODO: Intégrer avec Supabase ou un service email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      toast.success('Demande envoyée ! Nous vous recontactons sous 48h.');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border border-emerald-500/40 rounded-2xl p-8 text-center ${className}`}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="font-crimson text-2xl text-foreground mb-3">
          Votre demande est enregistrée !
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Notre équipe analyse votre projet et vous recontactera sous 48h 
          pour co-construire votre expérience sur-mesure.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-emerald-400">
          <span className="px-3 py-1 bg-emerald-950/50 rounded-full border border-emerald-500/20">
            ✓ Réponse sous 48h
          </span>
          <span className="px-3 py-1 bg-emerald-950/50 rounded-full border border-emerald-500/20">
            ✓ Devis personnalisé
          </span>
          <span className="px-3 py-1 bg-emerald-950/50 rounded-full border border-emerald-500/20">
            ✓ Éductour offert
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden ${className}`}
    >
      {/* En-tête attractif */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border-b border-emerald-500/20 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-crimson text-xl text-foreground">
              Concevons votre expérience
            </h3>
            <p className="text-sm text-emerald-400/80">
              Team building scientifique & bioacoustique
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Section 1: Expériences souhaitées */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">1</span>
            </div>
            <Label className="text-foreground font-medium">
              Quelles expériences vous intéressent ? *
            </Label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {experiences.map((exp) => {
              const Icon = exp.icon;
              const isSelected = formData.experiences.includes(exp.id);
              return (
                <motion.button
                  key={exp.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExperienceToggle(exp.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-emerald-950/50 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                      : 'bg-background/30 border-border/30 hover:border-border/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-500/30' : 'bg-muted/30'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {exp.label}
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-0.5">
                        {exp.description}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Format & Participants */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-orange-400">2</span>
            </div>
            <Label className="text-foreground font-medium">
              Format souhaité
            </Label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Taille du groupe */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Nombre de participants
              </Label>
              <RadioGroup 
                value={formData.tailleGroupe}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tailleGroupe: value }))}
                className="grid grid-cols-2 gap-2"
              >
                {taillesGroupe.map((taille) => (
                  <div key={taille.value} className="relative">
                    <RadioGroupItem 
                      value={taille.value} 
                      id={`taille-${taille.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`taille-${taille.value}`}
                      className="flex items-center justify-center px-3 py-2 text-xs rounded-lg border border-border/30 bg-background/30 cursor-pointer transition-all peer-data-[state=checked]:bg-orange-950/50 peer-data-[state=checked]:border-orange-500/50 peer-data-[state=checked]:text-orange-300 hover:border-border/60"
                    >
                      {taille.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Durée */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Durée envisagée
              </Label>
              <RadioGroup 
                value={formData.duree}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duree: value }))}
                className="flex flex-wrap gap-2"
              >
                {durees.map((duree) => (
                  <div key={duree.value} className="relative">
                    <RadioGroupItem 
                      value={duree.value} 
                      id={`duree-${duree.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`duree-${duree.value}`}
                      className="flex items-center justify-center px-4 py-2 text-xs rounded-lg border border-border/30 bg-background/30 cursor-pointer transition-all peer-data-[state=checked]:bg-blue-950/50 peer-data-[state=checked]:border-blue-500/50 peer-data-[state=checked]:text-blue-300 hover:border-border/60"
                    >
                      {duree.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Dates et lieu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates souhaitées
              </Label>
              <Input
                placeholder="Ex: Mars 2025, flexible..."
                value={formData.datesSouhaitees}
                onChange={(e) => setFormData(prev => ({ ...prev, datesSouhaitees: e.target.value }))}
                className="bg-background/50 border-border/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Lieu préféré
              </Label>
              <Input
                placeholder="Dordogne, Gironde, sur site..."
                value={formData.lieuPrefere}
                onChange={(e) => setFormData(prev => ({ ...prev, lieuPrefere: e.target.value }))}
                className="bg-background/50 border-border/30"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Objectifs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-400">3</span>
            </div>
            <Label className="text-foreground font-medium">
              Vos objectifs (optionnel)
            </Label>
          </div>
          
          <Textarea
            placeholder="Décrivez vos attentes : cohésion d'équipe, sensibilisation RSE, innovation, déconnexion, production de données CSRD..."
            value={formData.objectifs}
            onChange={(e) => setFormData(prev => ({ ...prev, objectifs: e.target.value }))}
            className="bg-background/50 border-border/30 min-h-[100px] resize-none"
          />

          {/* Option Qualiopi */}
          <div className="flex items-start gap-3 p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl">
            <Checkbox 
              id="qualiopi"
              checked={formData.budgetQualiopi}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, budgetQualiopi: checked as boolean }))}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="qualiopi" className="text-sm text-foreground cursor-pointer">
                Financement Qualiopi souhaité
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Nos formations sont éligibles au financement via notre partenaire certifié bziiit/Piloterra
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Coordonnées */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">4</span>
            </div>
            <Label className="text-foreground font-medium">
              Vos coordonnées *
            </Label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Nom complet
              </Label>
              <Input
                placeholder="Prénom Nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="bg-background/50 border-border/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Fonction</Label>
              <Input
                placeholder="DRH, Responsable RSE..."
                value={formData.fonction}
                onChange={(e) => setFormData(prev => ({ ...prev, fonction: e.target.value }))}
                className="bg-background/50 border-border/30"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Entreprise
              </Label>
              <Input
                placeholder="Nom de l'entreprise"
                value={formData.entreprise}
                onChange={(e) => setFormData(prev => ({ ...prev, entreprise: e.target.value }))}
                className="bg-background/50 border-border/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Téléphone
              </Label>
              <Input
                type="tel"
                placeholder="06 00 00 00 00"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                className="bg-background/50 border-border/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input
                type="email"
                placeholder="email@entreprise.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-background/50 border-border/30"
                required
              />
            </div>
          </div>
        </div>

        {/* Bouton d'envoi */}
        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-14 text-base bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Recevoir mon devis personnalisé
              </>
            )}
          </Button>
          
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Réponse sous 48h
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Devis sans engagement
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Éductour offert
            </span>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default ContactFormB2B;
