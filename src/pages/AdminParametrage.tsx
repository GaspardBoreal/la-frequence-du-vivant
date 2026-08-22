import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Mail,
  Sparkles,
  ShieldCheck,
  Link2,
  Copy,
  Check,
  KeyRound,
  Settings2,
  ExternalLink,
  Info,
} from 'lucide-react';

type ItemKind = 'config' | 'secret' | 'shared';

interface ConfigItem {
  name: string;
  role: string;
  where: string;
  kind: ItemKind;
  /** Commande à copier pour générer une valeur forte (secrets partagés). */
  gen?: string;
  /** Lien externe optionnel (où obtenir la valeur). */
  link?: { label: string; url: string };
}

interface Group {
  id: string;
  titre: string;
  icon: React.ElementType;
  accent: string; // classe text-*
  description: string;
  items: ConfigItem[];
}

const GROUPS: Group[] = [
  {
    id: 'smtp',
    titre: 'Messagerie SMTP',
    icon: Mail,
    accent: 'text-cyan-500',
    description:
      'Envoi des emails transactionnels (bienvenue, invitations lecteurs, confirmations). Edge function : send-smtp-email.',
    items: [
      {
        name: 'SMTP_HOST',
        role: 'Hôte du serveur SMTP',
        where: 'Ex. smtp.brevo.com, smtp.gmail.com, smtp.yourprovider.com',
        kind: 'config',
      },
      {
        name: 'SMTP_PORT',
        role: 'Port',
        where: '587 (STARTTLS) ou 465 (TLS implicite)',
        kind: 'config',
      },
 {
        name: 'SMTP_USER',
        role: 'Identifiant de connexion SMTP',
        where: 'Login fourni par votre prestataire email',
        kind: 'config',
      },
      {
        name: 'SMTP_PASSWORD',
        role: 'Mot de passe SMTP',
        where: 'Mot de passe ou mot de passe d’application (Gmail, etc.)',
        kind: 'secret',
      },
      {
        name: 'SMTP_FROM',
        role: 'Adresse d’expédition',
        where: 'Ex. La Fréquence du Vivant <contact@yourdomain.com>',
        kind: 'config',
      },
    ],
  },
  {
    id: 'ia',
    titre: 'Clés API Intelligence',
    icon: Sparkles,
    accent: 'text-violet-500',
    description:
      'Synthèse vocale, transcription audio et reconnaissance d’espèces par photo.',
    items: [
      {
        name: 'ELEVENLABS_API_KEY',
        role: 'Synthèse vocale (ElevenLabs)',
        where: 'elevenlabs.io → Profile → API Keys. Alternative : connecteur ElevenLabs du workspace.',
        kind: 'secret',
        link: { label: 'elevenlabs.io', url: 'https://elevenlabs.io/app/settings/api-keys' },
      },
      {
        name: 'OPENAI_API_KEY',
        role: 'Transcription Whisper + résumés éditoriaux',
        where: 'platform.openai.com → API keys (sk-…)',
        kind: 'secret',
        link: { label: 'platform.openai.com', url: 'https://platform.openai.com/api-keys' },
      },
      {
        name: 'PLANTNET_API_KEY',
        role: 'Reconnaissance d’espèces par photo',
        where: 'my.plantnet.org → compte → clé API',
        kind: 'secret',
        link: { label: 'my.plantnet.org', url: 'https://my.plantnet.org/account' },
      },
    ],
  },
  {
    id: 'webhooks',
    titre: 'Webhooks & secrets partagés',
    icon: ShieldCheck,
    accent: 'text-amber-500',
    description:
      'Authentification des appels entrants (cron planifiés, sondes BRAD). La même valeur doit figurer côté émetteur ET côté edge function — on ne la stocke jamais en base.',
    items: [
      {
        name: 'CRON_SHARED_SECRET',
        role: 'Authentifie les jobs planifiés (header X-Cron-Secret)',
        where: 'Reporter la même valeur dans la configuration du cron (pg_cron / scheduler).',
        kind: 'shared',
        gen: 'openssl rand -hex 32',
      },
      {
        name: 'BRAD_WEBHOOK_SECRET',
        role: 'Vérifie les webhooks BRAD (télémétrie sondes IoT)',
        where: 'Reporter la même valeur dans le dashboard BRAD Technology.',
        kind: 'shared',
        gen: 'openssl rand -hex 32',
      },
    ],
  },
];

interface Connection {
  name: string;
  role: string;
  status: 'connected' | 'pending';
  note: string;
}

const CONNECTIONS: Connection[] = [
  {
    name: 'Google Search Console',
    role: 'Visibilité Google, indexation, sitemap, diagnostic SEO',
    status: 'connected',
    note: 'Connexion « Gaspard’s Google Search Console » liée au projet. Secret : GOOGLE_SEARCH_CONSOLE_API_KEY (passerelle gateway).',
  },
];

const kindLabel: Record<ItemKind, { label: string; cls: string; icon: React.ElementType }> = {
  config: { label: 'Config', cls: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: Settings2 },
  secret: { label: 'Secret', cls: 'bg-violet-500/10 text-violet-600 border-violet-500/20', icon: KeyRound },
  shared: { label: 'Secret partagé', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: ShieldCheck },
};

function useClipboard() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      /* clipboard indisponible — ignoré */
    }
  };
  return { copied, copy };
}

const AdminParametrage: React.FC = () => {
  const { copied, copy } = useClipboard();

  const totalSecrets = GROUPS.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Admin
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings2 className="h-7 w-7 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">
              Paramétrage — Onboarding Fréquence Jardin
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Inventaire des secrets et connexions à configurer pour que la V1 tourne.
            Écran de référence : aucune valeur n’est stockée ici ni en base.
            Les secrets vivent dans le magasin sécurisé (Settings → Secrets) lus
            uniquement par les edge functions.
          </p>
        </div>

        {/* Bandeau d’avertissement sobriété / sécurité */}
        <Card className="p-4 mb-8 border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">À compléter après la V1.</strong> Tant qu’un
              secret est marqué <em>À configurer</em>, la edge function correspondante
              échoue à l’appel (clé absente). Les secrets partagés doivent être identiques
              des deux côtés : générez-les une fois, puis reporter la valeur chez l’émetteur
              (cron, BRAD) <em>et</em> dans le magasin sécurisé.
            </div>
          </div>
        </Card>

        {/* Synthèse */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalSecrets}</div>
            <div className="text-xs text-muted-foreground">secrets à définir</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {CONNECTIONS.filter((c) => c.status === 'connected').length}
            </div>
            <div className="text-xs text-muted-foreground">connexion liée</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {totalSecrets}
            </div>
            <div className="text-xs text-muted-foreground">en attente</div>
          </Card>
        </div>

        {/* Groupes de secrets */}
        <div className="space-y-8">
          {GROUPS.map((group) => (
            <section key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <group.icon className={`h-5 w-5 ${group.accent}`} />
                <h2 className="text-xl font-semibold text-foreground">{group.titre}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{group.description}</p>

              <div className="space-y-3">
                {group.items.map((item) => {
                  const k = kindLabel[item.kind];
                  const copyKey = `${group.id}-${item.name}`;
                  return (
                    <Card key={item.name} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono text-sm font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                              {item.name}
                            </code>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${k.cls}`}
                            >
                              <k.icon className="h-3 w-3" />
                              {k.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">
                              À configurer
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-foreground">{item.role}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.where}
                            {item.link && (
                              <a
                                href={item.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 inline-flex items-center gap-0.5 text-accent hover:underline"
                              >
                                {item.link.label}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {item.gen && (
                          <div className="shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copy(copyKey, item.gen!)}
                            >
                              {copied === copyKey ? (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                                  Copié
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                                  {item.gen}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Connexions liées */}
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-foreground">Connexions externes</h2>
          </div>
          <div className="space-y-3">
            {CONNECTIONS.map((c) => (
              <Card key={c.name} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <Check className="h-3 w-3" />
                        Connecté
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-foreground">{c.role}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.note}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-12 text-center text-xs text-muted-foreground">
          Écran de paramétrage — Onboarding Fréquence Jardin · Gaspard Boréal © 2025–2026
        </div>
      </div>
    </div>
  );
};

export default AdminParametrage;
