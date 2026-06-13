import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Crown, Loader2 } from 'lucide-react';
import {
  useCreateContact,
  useUpdateContact,
  type CrmContactRow,
} from '@/hooks/useCrmContacts';
import { useCrmCompanies } from '@/hooks/useCrmCompanies';

const schema = z.object({
  prenom: z.string().optional(),
  nom: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().optional(),
  entreprise: z.string().optional(),
  fonction: z.string().optional(),
  role_type: z.string().optional(),
  company_id: z.string().optional(),
  linkedin_url: z.string().url('URL invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
}).refine((v) => (v.prenom?.trim() || v.nom?.trim()), {
  message: 'Renseignez au moins un prénom ou un nom',
  path: ['nom'],
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: CrmContactRow | null;
}

export const ContactFormDialog: React.FC<Props> = ({ open, onOpenChange, contact }) => {
  const isEdit = !!contact;
  const create = useCreateContact();
  const update = useUpdateContact();
  const { data: companies = [] } = useCrmCompanies();
  const isLocked = isEdit && contact?.dirigeant_source && contact.dirigeant_source !== 'manual';
  const [overrideLock, setOverrideLock] = React.useState(false);
  const readOnly = isLocked && !overrideLock;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      prenom: '', nom: '', email: '', telephone: '', entreprise: '',
      fonction: '', role_type: 'autre', company_id: '', linkedin_url: '', notes: '',
    },
  });

  React.useEffect(() => {
    setOverrideLock(false);
    if (contact) {
      form.reset({
        prenom: contact.prenom ?? '',
        nom: contact.nom ?? '',
        email: contact.email ?? '',
        telephone: contact.telephone ?? '',
        entreprise: contact.entreprise ?? '',
        fonction: contact.fonction ?? contact.qualite ?? '',
        role_type: contact.role_type ?? 'autre',
        company_id: contact.company_id ?? '',
        linkedin_url: contact.linkedin_url ?? '',
        notes: contact.notes ?? '',
      });
    } else {
      form.reset({
        prenom: '', nom: '', email: '', telephone: '', entreprise: '',
        fonction: '', role_type: 'autre', company_id: '', linkedin_url: '', notes: '',
      });
    }
  }, [contact, form, open]);

  const onSubmit = (v: FormValues) => {
    const payload = {
      prenom: v.prenom || null,
      nom: v.nom || null,
      email: v.email || null,
      telephone: v.telephone || null,
      entreprise: v.entreprise || null,
      fonction: v.fonction || null,
      role_type: v.role_type || 'autre',
      company_id: v.company_id || null,
      linkedin_url: v.linkedin_url || null,
      notes: v.notes || null,
    };
    if (isEdit && contact) {
      update.mutate({ id: contact.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? 'Éditer le contact' : 'Nouveau contact'}
            {contact?.is_dirigeant && <Crown className="h-4 w-4 text-amber-400" />}
          </DialogTitle>
        </DialogHeader>

        {isLocked && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex items-center justify-between gap-2">
            <span>
              Ce contact est synchronisé depuis l'API Sirene. Les champs principaux sont en lecture seule.
            </span>
            <Button size="sm" variant="outline" onClick={() => setOverrideLock(true)}>
              Éditer manuellement
            </Button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="prenom" render={({ field }) => (
                <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="nom" render={({ field }) => (
                <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="telephone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="fonction" render={({ field }) => (
                <FormItem><FormLabel>Fonction / Qualité</FormLabel><FormControl><Input {...field} disabled={readOnly} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle commercial</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'autre'}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="dirigeant">Dirigeant</SelectItem>
                      <SelectItem value="decideur">Décideur</SelectItem>
                      <SelectItem value="operationnel">Opérationnel</SelectItem>
                      <SelectItem value="prescripteur">Prescripteur</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="company_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Entreprise principale</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)} value={field.value || '__none__'}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger></FormControl>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">Aucune</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.denomination ?? c.nom_complet} {c.ville ? `· ${c.ville}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="linkedin_url" render={({ field }) => (
              <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/…" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isEdit ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
