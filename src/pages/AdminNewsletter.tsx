import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Loader2, Mail, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
import {
  useNewsletterCampaigns,
  useNewsletterMutations,
  type NewsletterCampaign,
} from '@/hooks/admin/useNewsletter';
import { UNIVERS_THEMES, newBlock } from '@/lib/newsletter/blocks';

const STATUT_LABEL: Record<string, string> = {
  brouillon: 'Brouillon',
  test: 'Testée',
  envoi_en_cours: 'Envoi en cours',
  envoyee: 'Envoyée',
  arretee: 'Arrêtée',
};

/** Studio Newsletter — liste des campagnes. */
const AdminNewsletter: React.FC = () => {
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading } = useNewsletterCampaigns();
  const { create, remove, duplicate } = useNewsletterMutations();
  const [q, setQ] = React.useState('');
  const [toDelete, setToDelete] = React.useState<NewsletterCampaign | null>(null);

  const filtered = campaigns.filter((c) => c.nom.toLowerCase().includes(q.trim().toLowerCase()));

  const nouvelle = () =>
    create.mutate(
      {
        nom: 'Nouvelle lettre',
        univers: 'tous',
        objet: '',
        blocks: [
          newBlock('heading'),
          newBlock('text'),
          newBlock('button'),
          newBlock('footer'),
        ],
      } as Partial<NewsletterCampaign>,
      { onSuccess: (c) => navigate(`/admin/outils/newsletter/${c.id}`) },
    );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Link to="/admin/outils">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour Outils
          </Button>
        </Link>

        <div className="mb-6 mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <Mail className="h-6 w-6 text-primary" /> Studio Newsletter
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Composer, cibler, tester, envoyer et mesurer vos lettres et campagnes.
            </p>
          </div>
          <Button onClick={nouvelle} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Nouvelle lettre
          </Button>
        </div>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une campagne…"
          className="mb-4 max-w-sm"
        />

        {isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed p-12 text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 opacity-25" />
            <p className="text-sm text-muted-foreground">
              Aucune lettre pour l'instant. Créez la première pour relancer les marcheurs.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((c) => {
              const theme = UNIVERS_THEMES[c.univers] ?? UNIVERS_THEMES.tous;
              return (
                <Card key={c.id} className="overflow-hidden">
                  <div className="h-1.5" style={{ background: theme.accent }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/admin/outils/newsletter/${c.id}`} className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-semibold hover:text-primary">{c.nom}</h2>
                        <p className="truncate text-xs text-muted-foreground">{c.objet || 'Objet à écrire'}</p>
                      </Link>
                      <div className="flex shrink-0">
                        <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Dupliquer" onClick={() => duplicate.mutate(c)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" aria-label="Supprimer" onClick={() => setToDelete(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-full px-2 py-0.5 font-medium text-white" style={{ background: theme.accent }}>
                        {theme.label}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
                        {STATUT_LABEL[c.statut] ?? c.statut}
                      </span>
                      {c.sent_count > 0 && (
                        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
                          {c.sent_count} envois
                        </span>
                      )}
                    </div>

                    <Link to={`/admin/outils/newsletter/${c.id}`}>
                      <Button variant="outline" className="mt-3 w-full">
                        Ouvrir
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La lettre et ses statistiques d'envoi seront définitivement effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) remove.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNewsletter;
