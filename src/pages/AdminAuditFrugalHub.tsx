import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Leaf, Play, ExternalLink, Loader2, Plus } from 'lucide-react';
import { useAuditRuns } from '@/hooks/useAuditRuns';
import { useAuditPromptTemplates } from '@/hooks/useAuditPromptTemplates';
import { useLaunchAudit } from '@/hooks/useLaunchAudit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const AdminAuditFrugalHub: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: runs, isLoading: loadingRuns } = useAuditRuns();
  const { data: templates, isLoading: loadingTpls } = useAuditPromptTemplates();
  const launch = useLaunchAudit();

  const [selectedTpl, setSelectedTpl] = useState<string>('');
  const [scopeLabel, setScopeLabel] = useState('Marches du Vivant — Cœur applicatif');

  // New version editor
  const [editingTpl, setEditingTpl] = useState<{ id?: string; name: string; prompt_text: string } | null>(null);

  React.useEffect(() => {
    if (!selectedTpl && templates && templates.length > 0) {
      const active = templates.find((t) => t.is_active) ?? templates[0];
      setSelectedTpl(active.id);
    }
  }, [templates, selectedTpl]);

  const handleLaunch = async () => {
    if (!selectedTpl) return;
    const res = await launch.mutateAsync({ template_id: selectedTpl, scope_label: scopeLabel });
    if (res?.slug) navigate(`/audit-frugal/${res.slug}`);
  };

  const saveTemplate = async () => {
    if (!editingTpl || !editingTpl.name || !editingTpl.prompt_text) return;
    if (editingTpl.id) {
      const { error } = await supabase
        .from('audit_prompt_templates')
        .update({ prompt_text: editingTpl.prompt_text, name: editingTpl.name })
        .eq('id', editingTpl.id);
      if (error) return toast.error(error.message);
    } else {
      // new version: find highest version with same name and +1
      const existing = (templates ?? []).filter((t) => t.name === editingTpl.name);
      const nextVersion = existing.length ? Math.max(...existing.map((t) => t.version)) + 1 : 1;
      // Deactivate others with the same name
      if (existing.length) {
        await supabase.from('audit_prompt_templates').update({ is_active: false }).eq('name', editingTpl.name);
      }
      const { error } = await supabase.from('audit_prompt_templates').insert({
        name: editingTpl.name,
        version: nextVersion,
        prompt_text: editingTpl.prompt_text,
        is_active: true,
        referential: 'AFNOR_SPEC_2314',
      });
      if (error) return toast.error(error.message);
    }
    toast.success('Template enregistré');
    setEditingTpl(null);
    qc.invalidateQueries({ queryKey: ['audit-prompt-templates'] });
  };

  const togglePublic = async (id: string, current: boolean) => {
    const { error } = await supabase.from('audit_runs').update({ is_public: !current }).eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['audit-runs'] });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/admin/outils">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />Retour Outils
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-600">
            <Leaf className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Audit IA Frugale</h1>
          </div>
          <p className="text-muted-foreground">Référentiel AFNOR SPEC 2314 — Audit complet de la frugalité numérique IA</p>
        </div>

        <Tabs defaultValue="run" className="w-full">
          <TabsList>
            <TabsTrigger value="run">Lancer un audit</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="prompts">Bibliothèque prompts</TabsTrigger>
          </TabsList>

          {/* Lancer */}
          <TabsContent value="run" className="mt-4">
            <Card className="p-6 space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label>Mod��le de prompt</Label>
                <Select value={selectedTpl} onValueChange={setSelectedTpl}>
                  <SelectTrigger><SelectValue placeholder="Choisir un template" /></SelectTrigger>
                  <SelectContent>
                    {(templates ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — v{t.version} {t.is_active && '(actif)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Périmètre / Application auditée</Label>
                <Input value={scopeLabel} onChange={(e) => setScopeLabel(e.target.value)} />
              </div>
              <Button onClick={handleLaunch} disabled={!selectedTpl || launch.isPending} className="w-full">
                {launch.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Audit en cours… (peut prendre 1-2 min)</> : <><Play className="h-4 w-4 mr-2" />Lancer l'audit</>}
              </Button>
              <p className="text-xs text-muted-foreground">
                L'audit appelle Lovable AI Gateway (Gemini 2.5 Pro) avec le prompt sélectionné + une synthèse du contexte projet.
                Le rapport final sera publié sur <code>/audit-frugal/&lt;slug&gt;</code>.
              </p>
            </Card>
          </TabsContent>

          {/* Historique */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Périmètre</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Maturité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Public</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRuns && <TableRow><TableCell colSpan={8}>Chargement…</TableCell></TableRow>}
                  {(runs ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.launched_at).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="text-sm">{r.scope_label}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.launched_by_email ?? '—'}</TableCell>
                      <TableCell className="font-bold">{r.global_score ?? '—'}</TableCell>
                      <TableCell className="text-xs">{r.maturity_level ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'completed' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => togglePublic(r.id, r.is_public)}>
                          {r.is_public ? '🌍 ON' : '🔒 OFF'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === 'completed' && (
                          <Link to={`/audit-frugal/${r.slug}`} target="_blank">
                            <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3 mr-1" />Voir</Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loadingRuns && (runs ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Aucun audit pour l'instant.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Prompts */}
          <TabsContent value="prompts" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setEditingTpl({ name: 'AFNOR SPEC 2314 — IA Frugale', prompt_text: templates?.[0]?.prompt_text ?? '' })}>
                <Plus className="h-4 w-4 mr-1" />Nouvelle version
              </Button>
            </div>

            {editingTpl && (
              <Card className="p-4 space-y-3 border-emerald-500/30">
                <Label>Nom du template</Label>
                <Input value={editingTpl.name} onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })} />
                <Label>Prompt</Label>
                <Textarea
                  value={editingTpl.prompt_text}
                  onChange={(e) => setEditingTpl({ ...editingTpl, prompt_text: e.target.value })}
                  rows={20}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setEditingTpl(null)}>Annuler</Button>
                  <Button onClick={saveTemplate}>Enregistrer comme nouvelle version</Button>
                </div>
              </Card>
            )}

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Référentiel</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead>Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTpls && <TableRow><TableCell colSpan={5}>Chargement…</TableCell></TableRow>}
                  {(templates ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>v{t.version}</TableCell>
                      <TableCell className="text-xs">{t.referential}</TableCell>
                      <TableCell>{t.is_active ? '✅' : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAuditFrugalHub;
