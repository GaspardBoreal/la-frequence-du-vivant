import React from 'react';
import { useCrmContacts } from '@/hooks/useCrmContacts';
import { useCrmCompanies } from '@/hooks/useCrmCompanies';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Check, Crown, Plus, UserRound, X } from 'lucide-react';
import type { OppLinkedCompany, OppLinkedContact } from '@/hooks/useCrmOpportunityLinks';
import { ContactFormDialog } from '@/components/crm/contacts/ContactFormDialog';

const COMPANY_ROLES = [
  { value: 'primary', label: 'Principal' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'prescripteur', label: 'Prescripteur' },
];

const CONTACT_ROLES = [
  { value: 'interlocuteur', label: 'Interlocuteur' },
  { value: 'decideur', label: 'Décideur' },
  { value: 'signataire', label: 'Signataire' },
];

interface Props {
  companies: OppLinkedCompany[];
  contacts: OppLinkedContact[];
  onCompaniesChange: (v: OppLinkedCompany[]) => void;
  onContactsChange: (v: OppLinkedContact[]) => void;
}

export const OpportunityLinksSection: React.FC<Props> = ({
  companies, contacts, onCompaniesChange, onContactsChange,
}) => {
  const { data: allCompanies = [] } = useCrmCompanies();
  const selectedCompanyIds = React.useMemo(() => new Set(companies.map(c => c.company_id)), [companies]);

  // Contacts: prioritize those belonging to selected companies
  const { data: allContacts = [] } = useCrmContacts({});
  const selectedContactIds = React.useMemo(() => new Set(contacts.map(c => c.contact_id)), [contacts]);

  const sortedContacts = React.useMemo(() => {
    const inScope: typeof allContacts = [];
    const others: typeof allContacts = [];
    for (const c of allContacts) {
      if (c.company_id && selectedCompanyIds.has(c.company_id)) inScope.push(c);
      else others.push(c);
    }
    return [...inScope, ...others];
  }, [allContacts, selectedCompanyIds]);

  const [openCompanies, setOpenCompanies] = React.useState(false);
  const [openContacts, setOpenContacts] = React.useState(false);
  const [creatingContact, setCreatingContact] = React.useState(false);

  const addCompany = (id: string) => {
    if (selectedCompanyIds.has(id)) return;
    const c = allCompanies.find(x => x.id === id);
    onCompaniesChange([
      ...companies,
      {
        company_id: id,
        role: companies.length === 0 ? 'primary' : 'partenaire',
        denomination: c?.denomination ?? c?.nom_complet ?? null,
        ville: c?.ville ?? null,
        lifecycle_stage: c?.lifecycle_stage ?? null,
      },
    ]);
    setOpenCompanies(false);
  };

  const removeCompany = (id: string) => {
    onCompaniesChange(companies.filter(c => c.company_id !== id));
  };

  const changeCompanyRole = (id: string, role: string) => {
    let next = companies.map(c => c.company_id === id ? { ...c, role } : c);
    // Ensure single primary
    if (role === 'primary') {
      next = next.map(c => c.company_id === id ? c : (c.role === 'primary' ? { ...c, role: 'partenaire' } : c));
    }
    onCompaniesChange(next);
  };

  const addContact = (id: string) => {
    if (selectedContactIds.has(id)) return;
    const c = allContacts.find(x => x.id === id);
    onContactsChange([
      ...contacts,
      {
        contact_id: id,
        role: 'interlocuteur',
        prenom: c?.prenom,
        nom: c?.nom,
        email: c?.email,
        fonction: c?.fonction ?? c?.qualite ?? null,
      },
    ]);
    setOpenContacts(false);
  };

  const removeContact = (id: string) => {
    onContactsChange(contacts.filter(c => c.contact_id !== id));
  };

  const changeContactRole = (id: string, role: string) => {
    onContactsChange(contacts.map(c => c.contact_id === id ? { ...c, role } : c));
  };

  return (
    <div className="space-y-5">
      {/* Companies */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Entreprises liées <span className="text-destructive">*</span>
          </h3>
          <Popover open={openCompanies} onOpenChange={setOpenCompanies}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[360px] z-[1200]" align="end">
              <Command>
                <CommandInput placeholder="Rechercher une entreprise…" />
                <CommandList>
                  <CommandEmpty>Aucune entreprise. Importez-en depuis l'Annuaire.</CommandEmpty>
                  <CommandGroup>
                    {allCompanies.map(c => {
                      const isSel = selectedCompanyIds.has(c.id);
                      return (
                        <CommandItem
                          key={c.id}
                          value={`${c.denomination ?? ''} ${c.nom_complet ?? ''} ${c.siren ?? ''} ${c.ville ?? ''}`}
                          onSelect={() => addCompany(c.id)}
                          disabled={isSel}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isSel && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm truncate">{c.denomination ?? c.nom_complet}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {c.siren} {c.ville ? `· ${c.ville}` : ''} · {c.lifecycle_stage}
                              </p>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {companies.length === 0 ? (
          <p className="text-xs text-muted-foreground border border-dashed rounded-md p-3 text-center">
            Au moins une entreprise (prospect ou client) est requise.
          </p>
        ) : (
          <div className="space-y-1.5">
            {companies.map(c => (
              <div key={c.company_id} className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.denomination ?? 'Entreprise'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {c.ville} {c.lifecycle_stage ? `· ${c.lifecycle_stage}` : ''}
                  </p>
                </div>
                <Select value={c.role} onValueChange={(v) => changeCompanyRole(c.company_id, v)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1200]">
                    {COMPANY_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeCompany(c.company_id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" />
            Contacts liés <span className="text-destructive">*</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => setCreatingContact(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nouveau
            </Button>
            <Popover open={openContacts} onOpenChange={setOpenContacts}>
              <PopoverTrigger asChild>
                <Button type="button" size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px] z-[1200]" align="end">
                <Command>
                  <CommandInput placeholder="Rechercher un contact…" />
                  <CommandList>
                    <CommandEmpty>Aucun contact. Créez-en un.</CommandEmpty>
                    <CommandGroup heading={selectedCompanyIds.size > 0 ? 'Contacts des entreprises sélectionnées' : 'Tous les contacts'}>
                      {sortedContacts.map(c => {
                        const isSel = selectedContactIds.has(c.id);
                        const inScope = c.company_id && selectedCompanyIds.has(c.company_id);
                        return (
                          <CommandItem
                            key={c.id}
                            value={`${c.prenom ?? ''} ${c.nom ?? ''} ${c.email ?? ''} ${c.entreprise ?? ''}`}
                            onSelect={() => addContact(c.id)}
                            disabled={isSel}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isSel && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                              {c.is_dirigeant && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
                              <div className="min-w-0">
                                <p className="text-sm truncate">
                                  {[c.prenom, c.nom].filter(Boolean).join(' ') || '—'}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {c.fonction || c.qualite || '—'} {c.entreprise ? `· ${c.entreprise}` : ''}
                                </p>
                              </div>
                              {inScope && <Badge variant="outline" className="ml-auto text-[9px]">Liée</Badge>}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground border border-dashed rounded-md p-3 text-center">
            Au moins un contact (interlocuteur) est requis.
          </p>
        ) : (
          <div className="space-y-1.5">
            {contacts.map(c => (
              <div key={c.contact_id} className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm">
                <UserRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {[c.prenom, c.nom].filter(Boolean).join(' ') || c.email || 'Contact'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {c.fonction || '—'} {c.email ? `· ${c.email}` : ''}
                  </p>
                </div>
                <Select value={c.role} onValueChange={(v) => changeContactRole(c.contact_id, v)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1200]">
                    {CONTACT_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeContact(c.contact_id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContactFormDialog
        open={creatingContact}
        onOpenChange={setCreatingContact}
        contact={null}
      />
    </div>
  );
};
