import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ContactFormB2BProps {
  formationId?: string;
  source?: string;
  className?: string;
}

const ContactFormB2B: React.FC<ContactFormB2BProps> = ({ 
  formationId,
  source = 'marches-du-vivant',
  className = '' 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    entreprise: '',
    telephone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.entreprise || !formData.telephone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      // Pour l'instant, on simule l'envoi
      // TODO: Intégrer avec Supabase ou un service email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form submitted:', { ...formData, formationId, source });
      
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
        className={`bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-6 text-center ${className}`}
      >
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="font-crimson text-xl text-foreground mb-2">
          Demande envoyée !
        </h3>
        <p className="text-sm text-muted-foreground">
          Notre équipe vous recontactera sous 48h pour organiser votre marche du vivant.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6 ${className}`}
    >
      <h3 className="font-crimson text-xl text-foreground mb-4">
        Demander un devis
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Votre nom *"
            value={formData.nom}
            onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            className="bg-background/50"
            required
          />
          <Input
            placeholder="Entreprise *"
            value={formData.entreprise}
            onChange={(e) => setFormData(prev => ({ ...prev, entreprise: e.target.value }))}
            className="bg-background/50"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="tel"
            placeholder="Téléphone *"
            value={formData.telephone}
            onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
            className="bg-background/50"
            required
          />
          <Input
            type="email"
            placeholder="Email (optionnel)"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="bg-background/50"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-emerald-600 hover:bg-emerald-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Envoyer ma demande
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Formation éligible au financement Qualiopi via notre partenaire bziiit/Piloterra
        </p>
      </form>
    </motion.div>
  );
};

export default ContactFormB2B;
