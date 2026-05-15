import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Loader2, Copy, Check, BookOpen, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

interface InviteReaderDialogProps {
  eventId: string | null;
  eventTitle?: string | null;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary';
  triggerSize?: 'sm' | 'default' | 'lg';
  invalidateKey?: unknown[];
}

interface ProfileResult {
  user_id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const InviteReaderDialog: React.FC<InviteReaderDialogProps> = ({
  eventId,
  eventTitle,
  triggerLabel = 'Inviter un Lecteur',
  triggerVariant = 'outline',
  triggerSize = 'sm',
  invalidateKey,
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');

  // Mode "new"
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [result, setResult] = useState<{ url: string; emailSent: boolean; emailError: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  // Mode "existing"
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const reset = () => {
    setPrenom(''); setEmail(''); setSendEmail(true); setResult(null); setCopied(false);
    setSearch(''); setSelectedUserId(null); setMode('existing');
  };

  // Search existing profiles
  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['invite-search', eventId, debouncedSearch],
    queryFn: async () => {
      if (!eventId || debouncedSearch.trim().length < 2) return [] as ProfileResult[];
      const { data, error } = await supabase.rpc('search_community_profiles_for_invite', {
        _event_id: eventId,
        _search: debouncedSearch.trim(),
      });
      if (error) throw error;
      return (data || []) as ProfileResult[];
    },
    enabled: open && mode === 'existing' && !!eventId && debouncedSearch.trim().length >= 2,
  });

  // Mutation: create new invitation (email)
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('event-invitation-create', {
        body: {
          event_id: eventId,
          invited_email: email.trim().toLowerCase(),
          invited_prenom: prenom.trim(),
          send_email: sendEmail,
          site_url: window.location.origin,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { invite_url: string; email_sent: boolean; email_error: string | null };
    },
    onSuccess: (data) => {
      setResult({ url: data.invite_url, emailSent: data.email_sent, emailError: data.email_error });
      if (data.email_sent) toast.success(`Invitation envoyée à ${email}`);
      else toast.info('Invitation créée — partagez le lien manuellement.');
      if (invalidateKey) queryClient.invalidateQueries({ queryKey: invalidateKey });
    },
    onError: (e: Error) => toast.error(e.message || "Erreur lors de l'envoi"),
  });

  // Mutation: add existing user as reader
  const addExistingMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('add_existing_reader_to_event', {
        _event_id: eventId!,
        _user_id: userId,
      });
      if (error) throw error;
      return data as { success: boolean; already_reader?: boolean; already_participant?: boolean };
    },
    onSuccess: (data, userId) => {
      const profile = searchResults.find(p => p.user_id === userId);
      const name = profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : 'Le marcheur';
      if (data.already_participant) {
        toast.warning(`${name} est déjà participant validé de cet événement.`);
      } else if (data.already_reader) {
        toast.info(`${name} est déjà Lecteur invité.`);
      } else {
        toast.success(`${name} ajouté comme Lecteur invité.`);
        if (invalidateKey) queryClient.invalidateQueries({ queryKey: invalidateKey });
        setSearch(''); setSelectedUserId(null);
        setOpen(false); reset();
      }
    },
    onError: (e: Error) => toast.error(e.message || "Erreur lors de l'ajout"),
  });

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    toast.success('Lien copié');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <BookOpen className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {result ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Invitation créée ✅</DialogTitle>
              <DialogDescription>
                {result.emailSent
                  ? `Un email a été envoyé à ${email}.`
                  : `L'envoi automatique n'a pas pu aboutir${result.emailError ? ` (${result.emailError})` : ''}. Copiez le lien et partagez-le manuellement.`}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/40 p-3">
              <code className="text-xs break-all">{result.url}</code>
            </div>
            <div className="flex gap-2">
              <Button onClick={copy} className="flex-1" variant={copied ? 'secondary' : 'default'}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copié' : 'Copier le lien'}
              </Button>
              <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Fermer</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le lien expire dans 30 jours et est à usage unique.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Inviter un Lecteur</DialogTitle>
              <DialogDescription>
                {eventTitle
                  ? `Le destinataire pourra découvrir « ${eventTitle} » en lecture seule.`
                  : `Le destinataire accède à l'événement en lecture seule.`}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'existing' | 'new')} className="mt-2">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="existing"><Search className="h-4 w-4 mr-2" />Marcheur existant</TabsTrigger>
                <TabsTrigger value="new"><UserPlus className="h-4 w-4 mr-2" />Nouvelle personne</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-3 mt-4">
                <div>
                  <Label htmlFor="inv-search">Rechercher (prénom, nom ou email)</Label>
                  <Input
                    id="inv-search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Marie, Dupont, marie@…"
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto rounded-lg border divide-y">
                  {debouncedSearch.trim().length < 2 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      Saisissez au moins 2 caractères.
                    </p>
                  )}
                  {debouncedSearch.trim().length >= 2 && searching && (
                    <p className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />Recherche…
                    </p>
                  )}
                  {debouncedSearch.trim().length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      Aucun marcheur disponible (déjà invité, participant ou inexistant).
                    </p>
                  )}
                  {searchResults.map(p => {
                    const initials = `${(p.prenom ?? '').charAt(0)}${(p.nom ?? '').charAt(0)}`.toUpperCase() || '?';
                    const isLoading = addExistingMutation.isPending && selectedUserId === p.user_id;
                    return (
                      <div key={p.user_id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={addExistingMutation.isPending}
                          onClick={() => { setSelectedUserId(p.user_id); addExistingMutation.mutate(p.user_id); }}
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ajouter'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Le marcheur sera ajouté immédiatement, sans email.
                </p>
              </TabsContent>

              <TabsContent value="new" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="inv-prenom">Prénom *</Label>
                  <Input id="inv-prenom" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Marie" />
                </div>
                <div>
                  <Label htmlFor="inv-email">Email *</Label>
                  <Input id="inv-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marie@email.fr" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Envoyer l'email d'invitation</p>
                    <p className="text-xs text-muted-foreground">Sinon, vous pourrez copier le lien et le partager</p>
                  </div>
                  <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => createInviteMutation.mutate()}
                    disabled={!prenom.trim() || !email.trim() || createInviteMutation.isPending}
                    className="flex-1"
                  >
                    {createInviteMutation.isPending
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <Mail className="h-4 w-4 mr-2" />}
                    {sendEmail ? "Envoyer l'invitation" : 'Créer le lien'}
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteReaderDialog;
