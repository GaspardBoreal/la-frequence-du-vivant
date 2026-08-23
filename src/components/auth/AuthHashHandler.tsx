import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MailWarning, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

const RESET_PATH = '/marches-du-vivant/reset-password';

/**
 * Filet de sécurité pour les liens d'authentification Supabase.
 *
 * - `#access_token=...&type=recovery` arrivant sur une mauvaise page (ex. racine,
 *   quand l'URL de redirection n'est pas whitelistée) → redirection pleine page vers
 *   la page de réinitialisation, hash conservé (le SDK consomme la session recovery).
 * - `#error=access_denied&error_code=otp_expired` (lien expiré, déjà utilisé ou
 *   pré-chargé par un webmail/antivirus) → écran clair avec renvoi d'un nouvel email.
 */
const AuthHashHandler: React.FC = () => {
  const [linkExpired, setLinkExpired] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.slice(1));

    // Lien de récupération valide arrivé sur une mauvaise page
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      const path = window.location.pathname;
      if (path !== RESET_PATH && path !== '/admin/reset-password') {
        window.location.replace(`${RESET_PATH}${hash}`);
      }
      return;
    }

    // Lien expiré ou déjà consommé
    if (params.get('error')) {
      setLinkExpired(true);
      // Nettoie l'URL pour ne pas re-déclencher l'écran au rafraîchissement
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${RESET_PATH}`,
    });
    setIsSending(false);
    if (error) {
      toast.error(`Erreur: ${error.message}`);
    } else {
      setSent(true);
      toast.success('Nouveau lien envoyé ! Vérifiez votre boîte mail.');
    }
  };

  if (!linkExpired) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <MailWarning className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Lien expiré</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation a expiré ou a déjà été utilisé. Demandez-en un
            nouveau ci-dessous — pensez à cliquer sur le lien le plus récent reçu.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <p className="text-center text-sm text-muted-foreground">
              Email envoyé à <span className="font-medium text-foreground">{email}</span>.
              Le nouveau lien est valable une seule fois.
            </p>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Votre adresse email</Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSending}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Envoi...' : 'Renvoyer un lien de réinitialisation'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/marches-du-vivant/connexion"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthHashHandler;
