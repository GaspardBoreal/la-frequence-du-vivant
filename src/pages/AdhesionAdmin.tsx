import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, QrCode, Plus, Loader2, Users, Heart, ArrowLeft, Link2, X, Search } from 'lucide-react';

interface Campaign {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  support: string | null;
  is_active: boolean;
}

interface AdhesionRequest {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  ville: string | null;
  telephone: string | null;
  types_marches: string[];
  college_demande: string | null;
  status: string;
  source: string | null;
  campaign: string | null;
  created_at: string;
}

const BASE_URL = 'https://la-frequence-du-vivant.com/adhesion';

const AdhesionAdmin: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [requests, setRequests] = useState<AdhesionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('flyer-devenez-marcheur');
  const [newCampaign, setNewCampaign] = useState({ slug: '', label: '', support: '', description: '' });
  const [linkingRequest, setLinkingRequest] = useState<AdhesionRequest | null>(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [profileResults, setProfileResults] = useState<Array<{ id: string; prenom: string; nom: string; ville: string | null }>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<'actifs' | 'fondateurs' | 'partenaires_mecenes'>('actifs');
  const [linkBusy, setLinkBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: camps }, { data: reqs }] = await Promise.all([
      supabase.from('adhesion_campaigns').select('*').order('created_at', { ascending: false }),
      supabase
        .from('adhesion_requests')
        .select('id,email,prenom,nom,ville,telephone,types_marches,college_demande,status,source,campaign,created_at')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);
    setCampaigns((camps as Campaign[]) ?? []);
    setRequests((reqs as AdhesionRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAll();
  }, []);

  const qrUrl = useMemo(() => {
    const u = new URL(BASE_URL);
    u.searchParams.set('src', 'qr');
    if (selectedCampaign) u.searchParams.set('campaign', selectedCampaign);
    return u.toString();
  }, [selectedCampaign]);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrUrl, {
      width: 360,
      margin: 2,
      color: { dark: '#0D6B58', light: '#FAF8F3' },
      errorCorrectionLevel: 'H',
    }).catch(console.error);
  }, [qrUrl]);

  const handleDownload = async (format: 'png' | 'svg') => {
    if (format === 'png') {
      const data = await QRCode.toDataURL(qrUrl, {
        width: 2048,
        margin: 2,
        color: { dark: '#0D6B58', light: '#FAF8F3' },
        errorCorrectionLevel: 'H',
      });
      const a = document.createElement('a');
      a.href = data;
      a.download = `qr-frequence-${selectedCampaign}.png`;
      a.click();
    } else {
      const svg = await QRCode.toString(qrUrl, {
        type: 'svg',
        margin: 2,
        color: { dark: '#0D6B58', light: '#FAF8F3' },
        errorCorrectionLevel: 'H',
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-frequence-${selectedCampaign}.svg`;
      a.click();
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.slug || !newCampaign.label) {
      toast.error('Slug et libellé requis');
      return;
    }
    const { error } = await supabase.from('adhesion_campaigns').insert({
      slug: newCampaign.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      label: newCampaign.label,
      support: newCampaign.support || null,
      description: newCampaign.description || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Campagne créée');
    setNewCampaign({ slug: '', label: '', support: '', description: '' });
    fetchAll();
  };

  // Ouvre le dialogue de rattachement, pré-rempli avec le nom de la demande
  const openLinkDialog = async (r: AdhesionRequest) => {
    setLinkingRequest(r);
    setSelectedProfileId(null);
    setSelectedCollege((r.college_demande as any) || 'actifs');
    const initial = `${r.prenom} ${r.nom}`.trim();
    setProfileSearch(initial);
    await searchProfiles(initial);
  };

  const searchProfiles = async (q: string) => {
    if (!q || q.trim().length < 2) {
      setProfileResults([]);
      return;
    }
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from('community_profiles')
      .select('id, prenom, nom, ville')
      .or(`prenom.ilike.${term},nom.ilike.${term},ville.ilike.${term}`)
      .limit(20);
    setProfileResults((data as any) ?? []);
  };

  const confirmLink = async () => {
    if (!linkingRequest || !selectedProfileId) return;
    setLinkBusy(true);
    try {
      const { error: pErr } = await supabase
        .from('community_profiles')
        .update({
          is_adherent: true,
          college_adhesion: selectedCollege as never,
          adhesion_date: new Date().toISOString(),
          adhesion_source: linkingRequest.source ?? 'manual_admin',
          adhesion_campaign: linkingRequest.campaign ?? null,
          adhesion_commentaires: null,
        })
        .eq('id', selectedProfileId);
      if (pErr) throw pErr;
      const { error: rErr } = await supabase
        .from('adhesion_requests')
        .update({ status: 'linked', matched_profile_id: selectedProfileId })
        .eq('id', linkingRequest.id);
      if (rErr) throw rErr;
      toast.success('Demande rattachée et adhésion activée');
      setLinkingRequest(null);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors du rattachement');
    } finally {
      setLinkBusy(false);
    }
  };

  const rejectRequest = async (r: AdhesionRequest) => {
    if (!confirm(`Refuser la demande de ${r.prenom} ${r.nom} ?`)) return;
    const { error } = await supabase
      .from('adhesion_requests')
      .update({ status: 'rejected' })
      .eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Demande refusée');
    fetchAll();
  };


  const stats = useMemo(() => {
    const byStatus = requests.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    const byCampaign = requests.reduce<Record<string, number>>((acc, r) => {
      const k = r.campaign ?? '—';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    return { total: requests.length, byStatus, byCampaign };
  }, [requests]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        <header>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <Heart className="w-6 h-6 text-emerald-600" /> Adhésions — Kit & Pilotage
          </h1>
          <p className="text-muted-foreground">
            Générez vos QR codes trackés, suivez les demandes d'adhésion et pilotez les 3 collèges.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Demandes totales" value={stats.total} icon={<Users className="w-4 h-4" />} />
          <KpiCard label="Liées à un profil" value={stats.byStatus.linked ?? 0} />
          <KpiCard label="En attente" value={stats.byStatus.pending ?? 0} />
          <KpiCard label="Campagnes actives" value={campaigns.filter((c) => c.is_active).length} />
        </div>

        <Tabs defaultValue="qr">
          <TabsList>
            <TabsTrigger value="qr">QR & Campagnes</TabsTrigger>
            <TabsTrigger value="requests">Demandes ({stats.total})</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-6 mt-4">
            <Card className="p-5 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Campagne</Label>
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.label} {c.support ? `(${c.support})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  <strong>URL :</strong> {qrUrl}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleDownload('png')}>
                    <Download className="w-4 h-4 mr-2" /> PNG haute résolution
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('svg')}>
                    <Download className="w-4 h-4 mr-2" /> SVG vectoriel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Couleurs Forêt Émeraude (#0D6B58 sur Papier Crème #FAF8F3). Correction d'erreur niveau H — supporte un
                  logo central et reste lisible même partiellement imprimé.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="p-6 rounded-2xl bg-[#FAF8F3] shadow-sm border border-stone-200">
                  <canvas ref={canvasRef} />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nouvelle campagne
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={newCampaign.slug}
                    onChange={(e) => setNewCampaign({ ...newCampaign, slug: e.target.value })}
                    placeholder="salon-agri-2026"
                  />
                </div>
                <div>
                  <Label>Libellé</Label>
                  <Input
                    value={newCampaign.label}
                    onChange={(e) => setNewCampaign({ ...newCampaign, label: e.target.value })}
                    placeholder="Salon Agriculture 2026"
                  />
                </div>
                <div>
                  <Label>Support</Label>
                  <Input
                    value={newCampaign.support}
                    onChange={(e) => setNewCampaign({ ...newCampaign, support: e.target.value })}
                    placeholder="flyer / mug / tee-shirt / kakemono…"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateCampaign} className="mt-3">
                <Plus className="w-4 h-4 mr-2" /> Créer la campagne
              </Button>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-3">Performance par campagne</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(stats.byCampaign).map(([k, n]) => (
                  <div key={k} className="flex justify-between border-b border-stone-100 dark:border-emerald-500/10 py-1">
                    <span>{k}</span>
                    <Badge variant="secondary">{n}</Badge>
                  </div>
                ))}
                {Object.keys(stats.byCampaign).length === 0 && (
                  <p className="text-muted-foreground text-sm">Aucune demande pour l'instant.</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card className="p-0 overflow-hidden">
              {loading ? (
                <div className="flex items-center gap-2 p-6">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 dark:bg-emerald-950/40">
                      <tr>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Nom</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Ville</th>
                        <th className="text-left p-2">Types</th>
                        <th className="text-left p-2">Collège</th>
                        <th className="text-left p-2">Source</th>
                        <th className="text-left p-2">Statut</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id} className="border-t border-stone-100 dark:border-emerald-500/10">
                          <td className="p-2 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-2">{r.prenom} {r.nom}</td>
                          <td className="p-2">{r.email}</td>
                          <td className="p-2">{r.ville ?? '—'}</td>
                          <td className="p-2">{r.types_marches?.join(', ') || '—'}</td>
                          <td className="p-2">{r.college_demande ?? '—'}</td>
                          <td className="p-2">{r.campaign ?? r.source ?? '—'}</td>
                          <td className="p-2">
                            <Badge
                              variant={r.status === 'linked' ? 'default' : 'secondary'}
                              className={
                                r.status === 'linked'
                                  ? 'bg-emerald-600'
                                  : r.status === 'rejected'
                                    ? 'bg-stone-400'
                                    : ''
                              }
                            >
                              {r.status === 'linked' ? '✓ Liée' : r.status === 'rejected' ? 'Refusée' : 'En attente'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {r.status === 'pending' ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => openLinkDialog(r)}>
                                  <Link2 className="w-3.5 h-3.5 mr-1" /> Rattacher
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => rejectRequest(r)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-muted-foreground">
                            Aucune demande d'adhésion pour l'instant.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-4 text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Liée</strong> · l'email correspond à un compte existant et le profil a été automatiquement
                passé en Collège des Actifs.
              </p>
              <p>
                <strong>En attente</strong> · aucun compte ne correspond à cet email. Cliquez sur
                « Rattacher » pour relier la demande à un profil existant et choisir son collège (Actifs, Fondateurs,
                Partenaires &amp; Mécènes).
              </p>
              <p>
                Pour changer le collège d'un adhérent après coup, ouvrez sa fiche dans
                <strong> /admin/community → onglet Profils</strong> et utilisez la section « Adhésion association ».
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!linkingRequest} onOpenChange={(v) => !v && setLinkingRequest(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Rattacher la demande à un profil</DialogTitle>
              <DialogDescription>
                {linkingRequest && (
                  <>Demande de <strong>{linkingRequest.prenom} {linkingRequest.nom}</strong> ({linkingRequest.email}).</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Rechercher un profil</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={profileSearch}
                    onChange={(e) => { setProfileSearch(e.target.value); searchProfiles(e.target.value); }}
                    placeholder="Prénom, nom, ville…"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-auto border rounded-md divide-y">
                {profileResults.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">Aucun profil trouvé.</p>
                ) : profileResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`w-full text-left p-2 text-sm hover:bg-muted transition ${selectedProfileId === p.id ? 'bg-primary/10' : ''}`}
                  >
                    <div className="font-medium">{p.prenom} {p.nom}</div>
                    {p.ville && <div className="text-xs text-muted-foreground">{p.ville}</div>}
                  </button>
                ))}
              </div>
              <div>
                <Label>Collège d'adhésion</Label>
                <Select value={selectedCollege} onValueChange={(v) => setSelectedCollege(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actifs">Collège des Actifs</SelectItem>
                    <SelectItem value="fondateurs">Collège des Fondateurs</SelectItem>
                    <SelectItem value="partenaires_mecenes">Collège des Partenaires &amp; Mécènes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkingRequest(null)}>Annuler</Button>
              <Button onClick={confirmLink} disabled={!selectedProfileId || linkBusy}>
                {linkBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                Rattacher &amp; activer l'adhésion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: number; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <Card className="p-4">
    <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </Card>
);

export default AdhesionAdmin;
