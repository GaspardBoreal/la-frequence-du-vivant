import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ExternalLink, Sparkles, Save, X, AlertCircle } from 'lucide-react';
import { NETWORK_META, NETWORK_ORDER, type ScienceNetwork } from '@/types/scienceAccounts';
import { useProfileScienceAccounts, useUpsertScienceAccount, useDeleteScienceAccount } from '@/hooks/useScienceAccounts';
import NetworkBadge from './NetworkBadge';

interface Props {
  profileId: string;
}

export interface ScienceAccountsEditorHandle {
  flushPending: () => Promise<void>;
  hasPending: () => boolean;
}

export const ScienceAccountsEditor = forwardRef<ScienceAccountsEditorHandle, Props>(({ profileId }, ref) => {
  const { data: accounts = [], isLoading } = useProfileScienceAccounts(profileId);
  const upsert = useUpsertScienceAccount();
  const remove = useDeleteScienceAccount();

  const [adding, setAdding] = useState(false);
  const [network, setNetwork] = useState<ScienceNetwork>('inaturalist');
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  const reset = () => {
    setAdding(false); setNetwork('inaturalist'); setUsername(''); setProfileUrl('');
  };

  const submit = async () => {
    if (!username.trim()) return;
    await upsert.mutateAsync({
      profile_id: profileId,
      network,
      username,
      profile_url: profileUrl || null,
    });
    reset();
  };

  useImperativeHandle(ref, () => ({
    hasPending: () => adding && username.trim().length > 0,
    flushPending: async () => {
      if (adding && username.trim()) {
        await upsert.mutateAsync({
          profile_id: profileId,
          network,
          username,
          profile_url: profileUrl || null,
        });
        reset();
      }
    },
  }), [adding, username, network, profileUrl, profileId, upsert]);

  const hasPendingDraft = adding && username.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Comptes sciences participatives
        </Label>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Ajouter
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : accounts.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground italic">
          Aucun compte enregistré (iNaturalist, eBird, GBIF…)
        </p>
      ) : (
        <ul className="space-y-1.5">
          {accounts.map(a => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-2 py-1.5"
            >
              <NetworkBadge network={a.network} username={a.username} url={a.profile_url} verified={a.verified} size="sm" asLink={false} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">@{a.username}</p>
                <p className="text-[10px] text-muted-foreground">{NETWORK_META[a.network].label}</p>
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={a.verified}
                  onCheckedChange={(v) => upsert.mutate({ id: a.id, profile_id: profileId, network: a.network, username: a.username, profile_url: a.profile_url, verified: v })}
                  aria-label="Vérifié"
                />
                <span className="text-[10px] text-muted-foreground mr-1">vérifié</span>
                {a.profile_url && (
                  <a href={a.profile_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => remove.mutate(a.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Réseau</Label>
              <Select value={network} onValueChange={(v) => setNetwork(v as ScienceNetwork)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NETWORK_ORDER.map(k => (
                    <SelectItem key={k} value={k} className="text-xs">{NETWORK_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Identifiant (@username)</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: jean-dupont"
                className="h-8 text-xs"
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">URL personnalisée (optionnel)</Label>
            <Input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="laisse vide pour utiliser l'URL par défaut"
              className="h-8 text-xs"
              maxLength={500}
            />
          </div>
          {hasPendingDraft && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3" />
              Brouillon — sera enregistré avec la fiche, ou cliquez ci-dessous.
            </p>
          )}
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={reset} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" /> Annuler
            </Button>
            <Button size="sm" onClick={submit} disabled={!username.trim() || upsert.isPending} className="h-7 text-xs">
              <Save className="h-3 w-3 mr-1" /> Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

ScienceAccountsEditor.displayName = 'ScienceAccountsEditor';

export default ScienceAccountsEditor;
