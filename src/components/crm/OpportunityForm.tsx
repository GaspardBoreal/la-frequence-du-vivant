import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EXPERIENCE_OPTIONS,
  FORMAT_OPTIONS,
  FINANCEMENT_OPTIONS,
  SOURCE_OPTIONS,
  KANBAN_COLUMNS,
  type CrmOpportunity,
} from '@/types/crm';
import { useTeamMembers } from '@/hooks/useTeamMembers';

const opportunitySchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  entreprise: z.string().optional(),
  fonction: z.string().optional(),
  telephone: z.string().optional(),
  experience_souhaitee: z.string().optional(),
  format_souhaite: z.string().optional(),
  date_souhaitee: z.string().optional(),
  lieu_prefere: z.string().optional(),
  objectifs: z.string().optional(),
  financement_souhaite: z.string().optional(),
  budget_estime: z.coerce.number().optional(),
  nombre_participants: z.coerce.number().optional(),
  statut: z.string().default('a_contacter'),
  notes: z.string().optional(),
  assigned_to: z.string().optional(),
  source: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface OpportunityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: CrmOpportunity | null;
  onSubmit: (data: OpportunityFormData) => void;
  isSubmitting?: boolean;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  open,
  onOpenChange,
  opportunity,
  onSubmit,
  isSubmitting = false,
}) => {
  const { activeMembers } = useTeamMembers();
  const isEditing = !!opportunity;

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      prenom: opportunity?.prenom || '',
      nom: opportunity?.nom || '',
      email: opportunity?.email || '',
      entreprise: opportunity?.entreprise || '',
      fonction: opportunity?.fonction || '',
      telephone: opportunity?.telephone || '',
      experience_souhaitee: opportunity?.experience_souhaitee || '',
      format_souhaite: opportunity?.format_souhaite || '',
      date_souhaitee: opportunity?.date_souhaitee || '',
      lieu_prefere: opportunity?.lieu_prefere || '',
      objectifs: opportunity?.objectifs || '',
      financement_souhaite: opportunity?.financement_souhaite || '',
      budget_estime: opportunity?.budget_estime || undefined,
      nombre_participants: opportunity?.nombre_participants || undefined,
      statut: opportunity?.statut || 'a_contacter',
      notes: opportunity?.notes || '',
      assigned_to: opportunity?.assigned_to || '',
      source: opportunity?.source || '',
    },
  });

  React.useEffect(() => {
    if (opportunity) {
      form.reset({
        prenom: opportunity.prenom,
        nom: opportunity.nom,
        email: opportunity.email,
        entreprise: opportunity.entreprise || '',
        fonction: opportunity.fonction || '',
        telephone: opportunity.telephone || '',
        experience_souhaitee: opportunity.experience_souhaitee || '',
        format_souhaite: opportunity.format_souhaite || '',
        date_souhaitee: opportunity.date_souhaitee || '',
        lieu_prefere: opportunity.lieu_prefere || '',
        objectifs: opportunity.objectifs || '',
        financement_souhaite: opportunity.financement_souhaite || '',
        budget_estime: opportunity.budget_estime || undefined,
        nombre_participants: opportunity.nombre_participants || undefined,
        statut: opportunity.statut,
        notes: opportunity.notes || '',
        assigned_to: opportunity.assigned_to || '',
        source: opportunity.source || '',
      });
    } else {
      form.reset({
        prenom: '',
        nom: '',
        email: '',
        entreprise: '',
        fonction: '',
        telephone: '',
        experience_souhaitee: '',
        format_souhaite: '',
        date_souhaitee: '',
        lieu_prefere: '',
        objectifs: '',
        financement_souhaite: '',
        budget_estime: undefined,
        nombre_participants: undefined,
        statut: 'a_contacter',
        notes: '',
        assigned_to: '',
        source: '',
      });
    }
  }, [opportunity, form]);

  const handleSubmit = (data: OpportunityFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Informations contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fonction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonction</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Détails du projet</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="experience_souhaitee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expérience souhaitée</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPERIENCE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="format_souhaite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format souhaité</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FORMAT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_souhaitee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date souhaitée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lieu_prefere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu préféré</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nb participants</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget_estime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (€)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="financement_souhaite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FINANCEMENT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="objectifs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectifs</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pipeline & Assignment */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Pipeline</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KANBAN_COLUMNS.map(col => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigné à</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Non assigné" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Non assigné</SelectItem>
                          {activeMembers.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.prenom} {member.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
