import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SecureRichTextEditor } from '@/components/ui/secure-rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Download, Plus, QrCode, Send, Trash2 } from 'lucide-react';

const PUBLIC_BASE = 'https://la-frequence-du-vivant.com';

interface EventOption {
  id: string;
  title: string;
  date_marche: string | null;
  lieu: string | null;
}

interface SignupLink {
  id: string;
  event_id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  expires_at: string | null;
  email_subject: string | null;
  email_html: string | null;
  created_at: string;
}

const defaultSubject = (title: string) => `Votre inscription à « ${title} » est enregistrée 🌿`;

const defaultHtml = (title: string) => `
<p>Bonjour,</p>
<p>Votre inscription à la marche <strong>${title}</strong> est bien enregistrée.</p>
<p>Nous validerons votre présence sur place le jour de la marche. D'ici là, vous pouvez découvrir votre espace marcheur.</p>
<p>À très bientôt sur les chemins,<br/>L'équipe de La Fréquence du Vivant</p>
`.trim();

export const EventQrTab: React.FC = () => {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [links, setLinks] = useState<SignupLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SignupLink>>({});
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const active = useMemo(() => links.find((l) => l.id === activeId) ?? null, [links, activeId]);
  const activeEvent = useMemo(
    () => events.find((e) => e.id === active?.event_id) ?? null,
    [events, active],
  );

  const qrUrl = active
    ? `${PUBLIC_BASE}/marches-du-vivant/connexion?tab=register&event=${active.code}`
    : '';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: evts }, { data: lnks, error }] = await Promise.all([
      supabase
        .from('marche_events')
        .select('id, title, date_marche, lieu')
        .order('date_marche', { ascending: false })
        .limit(200),
      supabase
        .from('event_signup_links')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setEvents((evts as EventOption[]) ?? []);
    setLinks((lnks as SignupLink[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (active) setDraft({ ...active });
  }, [active]);

  useEffect(() => {
    if (!qrUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrUrl, { width: 280, margin: 1 }).catch(() => {});
  }, [qrUrl]);

  const createLink = async () => {
    if (!selectedEvent) { toast.error('Choisissez une marche'); return; }
    const evt = events.find((e) => e.id === selectedEvent);
    setCreating(true);
    const { data, error } = await supabase
      .from('event_signup_links')
      .insert({
        event_id: selectedEvent,
        label: evt?.title ?? null,
        email_subject: defaultSubject(evt?.title ?? 'la marche'),
        email_html: defaultHtml(evt?.title ?? 'la marche'),
      })
      .select()
      .single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success('QR code créé');
    setLinks((prev) => [data as SignupLink, ...prev]);
    setActiveId((data as SignupLink).id);
  };

  const saveDraft = async () => {
    if (!active) return;
    setSaving(true);
    const { error } = await supabase
      .from('event_signup_links')
      .update({
        label: draft.label ?? null,
        is_active: draft.is_active ?? true,
        expires_at: draft.expires_at || null,
        email_subject: draft.email_subject ?? null,
        email_html: draft.email_html ?? null,
      })
      .eq('id', active.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Enregistré');
    fetchAll();
  };

  const removeLink = async (id: string) => {
    if (!confirm('Supprimer ce QR code ? Les liens déjà imprimés cesseront de fonctionner.')) return;
    const { error } = await supabase.from('event_signup_links').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setActiveId((cur) => (cur === id ? null : cur));
    fetchAll();
  };

  const downloadPng = async () => {
    if (!qrUrl) return;
    const url = await QRCode.toDataURL(qrUrl, { width: 1024, margin: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${active?.code ?? 'evenement'}.png`;
    a.click();
  };

  const sendTest = async () => {
    if (!active) return;
    const { error } = await supabase.functions.invoke('event-signup-welcome', {
      body: { code: active.code, kind: 'test' },
    });
    if (error) { toast.error("Échec de l'envoi de test"); return; }
    toast.success('Email de test envoyé à votre adresse');
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <QrCode className="w-4 h-4" /> Nouveau QR code d'inscription à un événement
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Label>Marche</Label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Choisir une marche —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}{e.date_marche ? ` — ${new Date(e.date_marche).toLocaleDateString('fr-FR')}` : ''}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={createLink} disabled={creating}>
            <Plus className="w-4 h-4 mr-1" /> Créer
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Card className="p-4 space-y-2">
          <div className="text-sm font-medium mb-2">QR codes existants</div>
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && links.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun QR code pour l'instant.</p>
          )}
          {links.map((l) => {
            const evt = events.find((e) => e.id === l.event_id);
            return (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className={`w-full text-left rounded-lg border p-3 transition ${
                  activeId === l.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{l.label || evt?.title || 'Sans titre'}</span>
                  <Badge variant={l.is_active ? 'default' : 'secondary'}>
                    {l.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{l.code}</div>
              </button>
            );
          })}
        </Card>

        {active && (
          <Card className="p-5 space-y-5">
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              <div className="space-y-3">
                <canvas ref={canvasRef} className="rounded-lg border bg-white p-2 mx-auto" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={downloadPng}>
                    <Download className="w-4 h-4 mr-1" /> PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('Lien copié'); }}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Lien
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground break-all">{qrUrl}</p>
                {activeEvent && (
                  <p className="text-xs text-muted-foreground">
                    Marche : <strong>{activeEvent.title}</strong>
                    {activeEvent.date_marche ? ` — ${new Date(activeEvent.date_marche).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">QR code actif</div>
                    <p className="text-xs text-muted-foreground">
                      Désactivé, le lien n'inscrit plus personne.
                    </p>
                  </div>
                  <Switch
                    checked={draft.is_active ?? true}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Libellé interne</Label>
                    <Input
                      value={draft.label ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                      placeholder="Affiche salle de dégustation"
                    />
                  </div>
                  <div>
                    <Label>Expiration (optionnelle)</Label>
                    <Input
                      type="datetime-local"
                      value={draft.expires_at ? String(draft.expires_at).slice(0, 16) : ''}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Objet de l'email</Label>
                  <Input
                    value={draft.email_subject ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, email_subject: e.target.value }))}
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label>Message de bienvenue</Label>
                  <SecureRichTextEditor
                    value={draft.email_html ?? ''}
                    onChange={(v) => setDraft((d) => ({ ...d, email_html: v }))}
                    placeholder="Texte envoyé au nouveau marcheur…"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variables disponibles : <code>{'{{prenom}}'}</code>, <code>{'{{marche}}'}</code>,
                    {' '}<code>{'{{date}}'}</code>, <code>{'{{lieu}}'}</code>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveDraft} disabled={saving}>
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                  <Button variant="outline" onClick={sendTest}>
                    <Send className="w-4 h-4 mr-1" /> Test sur mon adresse
                  </Button>
                  <Button variant="ghost" className="text-destructive" onClick={() => removeLink(active.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventQrTab;
