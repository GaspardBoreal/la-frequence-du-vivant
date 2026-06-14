import React from 'react';
import { useCrmContacts, useDeleteContact } from '@/hooks/useCrmContacts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Loader2, Plus, Trash2, UserRound, Mail, Phone, Pencil } from 'lucide-react';
import { ContactFormDialog } from './ContactFormDialog';
import type { CrmContactRow } from '@/hooks/useCrmContacts';
import { FiltersBandeau, type FilterChip } from '@/components/crm/filters/FiltersBandeau';
import { ContactFiltersDrawer, type ContactFiltersValue } from '@/components/crm/filters/ContactFiltersDrawer';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Crown, Loader2, Plus, Search, Trash2, UserRound, Mail, Phone, Pencil } from 'lucide-react';
import { ContactFormDialog } from './ContactFormDialog';
import type { CrmContactRow } from '@/hooks/useCrmContacts';

const ROLE_LABEL: Record<string, string> = {
  dirigeant: 'Dirigeant',
  decideur: 'Décideur',
  operationnel: 'Opérationnel',
  prescripteur: 'Prescripteur',
  autre: 'Autre',
};

const ROLE_TONE: Record<string, string> = {
  dirigeant: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  decideur: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  operationnel: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  prescripteur: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  autre: 'bg-muted text-muted-foreground border-border',
};

function initials(prenom?: string | null, nom?: string | null) {
  const p = (prenom?.[0] ?? '').toUpperCase();
  const n = (nom?.[0] ?? '').toUpperCase();
  return (p + n) || '?';
}

export const CrmContactsTab: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [roleType, setRoleType] = React.useState<string>('all');
  const [dirigeantOnly, setDirigeantOnly] = React.useState(false);
  const { data: contacts = [], isLoading } = useCrmContacts({ search, roleType, dirigeantOnly });

  const [editing, setEditing] = React.useState<CrmContactRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<CrmContactRow | null>(null);
  const deleteContact = useDeleteContact();

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un contact, une entreprise, un email…"
              className="pl-9"
            />
          </div>
          <Select value={roleType} onValueChange={setRoleType}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="dirigeant">Dirigeants</SelectItem>
              <SelectItem value="decideur">Décideurs</SelectItem>
              <SelectItem value="operationnel">Opérationnels</SelectItem>
              <SelectItem value="prescripteur">Prescripteurs</SelectItem>
              <SelectItem value="autre">Autres</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={dirigeantOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDirigeantOnly((v) => !v)}
            className="gap-1.5"
          >
            <Crown className="h-3.5 w-3.5" />
            Dirigeants API
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {contacts.length} contact{contacts.length > 1 ? 's' : ''}
            </span>
            <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Nouveau
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <UserRound className="h-10 w-10 mx-auto opacity-30" />
            <p>Aucun contact pour le moment.</p>
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Créer un contact</Button>
          </div>
        ) : (
          <TooltipProvider delayDuration={150}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[34%]">Contact</TableHead>
                  <TableHead className="w-[22%]">Fonction</TableHead>
                  <TableHead className="w-[20%]">Entreprise</TableHead>
                  <TableHead className="w-[18%]">Coordonnées</TableHead>
                  <TableHead className="w-[6%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => {
                  const role = c.role_type || 'autre';
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setEditing(c)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials(c.prenom, c.nom)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium truncate">
                                {[c.prenom, c.nom].filter(Boolean).join(' ') || '—'}
                              </p>
                              {c.is_dirigeant && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Dirigeant {c.dirigeant_source === 'api_sirene' ? '(source API Sirene)' : ''}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <Badge variant="outline" className={`mt-0.5 text-[10px] font-normal ${ROLE_TONE[role] ?? ROLE_TONE.autre}`}>
                              {ROLE_LABEL[role] ?? role}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="truncate block max-w-[260px]" title={c.fonction ?? c.qualite ?? ''}>
                          {c.fonction || c.qualite || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="truncate block max-w-[220px]" title={c.entreprise ?? ''}>
                          {c.entreprise || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          {c.email && (
                            <p className="flex items-center gap-1.5 truncate max-w-[200px]">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </p>
                          )}
                          {c.telephone && (
                            <p className="flex items-center gap-1.5 truncate max-w-[200px]">
                              <Phone className="h-3 w-3" />
                              {c.telephone}
                            </p>
                          )}
                          {!c.email && !c.telephone && <span>—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(c)} aria-label="Éditer">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setToDelete(c)} aria-label="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </Card>

      <ContactFormDialog
        open={creating || !!editing}
        contact={editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>Cette action est irréversible. Le contact <strong>{[toDelete.prenom, toDelete.nom].filter(Boolean).join(' ')}</strong> sera retiré du CRM (les liens vers les opportunités le seront aussi).</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteContact.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
