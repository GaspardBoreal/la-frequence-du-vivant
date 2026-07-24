import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Leaf, Mail, Lock, User, MapPin, Phone, Calendar, Sparkles, Eye, EyeOff, TreePine, Ear, Flower2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Footer from '@/components/Footer';
import { clearStoredAffiliateToken, getStoredAffiliateToken, storeAffiliateToken } from '@/utils/communityAffiliate';
import { AppChoiceDialog, getDefaultAppTarget } from '@/components/community/AppChoiceDialog';
import type { ProprieteAccess } from '@/hooks/useUserAppsAccess';

const TYPE_MARCHE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'agroecologique', label: '🌱 Agroécologique', hint: 'sols, cultures, pratiques régénératives' },
  { value: 'eco_touristique', label: '🌿 Éco-touristique', hint: 'paysages, patrimoine, découverte territoriale' },
  { value: 'rse_rso', label: '🤝 Pratiques RSE / RSO', hint: 'engagement social et environnemental d’entreprise' },
  { value: 'team_building', label: '🏢 Team-building entreprise', hint: 'cohésion d’équipe au contact du vivant' },
  { value: 'autre', label: '✨ Autre', hint: 'précisez votre intention ci-dessous' },
];

const MarchesDuVivantConnexion = () => {
  const navigate = useNavigate();
  const { signUp, signIn, resetPassword, checkEmailExists } = useCommunityAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [motivation, setMotivation] = useState('');
  const [kigo, setKigo] = useState('');
  const [superpouvoir, setSuperpouvoir] = useState('');
  const [intimite, setIntimite] = useState('');
  const [engagement, setEngagement] = useState(false);
  const [typesMarches, setTypesMarches] = useState<string[]>([]);
  const [autreTypeMarche, setAutreTypeMarche] = useState('');
  const [recherchePrioritaire, setRecherchePrioritaire] = useState('');
  const [consentementAnalyse, setConsentementAnalyse] = useState(false);
  const [emailConfirmDialog, setEmailConfirmDialog] = useState<{ open: boolean; email: string }>({ open: false, email: '' });
  const [resendingEmail, setResendingEmail] = useState(false);
  const [appChoice, setAppChoice] = useState<{ open: boolean; prenom?: string; proprietes: ProprieteAccess[] }>({ open: false, proprietes: [] });

  // Invitation Lecteur invité
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationInfo, setInvitationInfo] = useState<{
    valid: boolean;
    reason?: string;
    invited_email?: string;
    invited_prenom?: string;
    event_id?: string | null;
    event_title?: string | null;
    inviter_prenom?: string | null;
  } | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setMode('register');
    }

    const affiliateToken = searchParams.get('affiliate');
    if (affiliateToken) {
      storeAffiliateToken(affiliateToken);
      setMode('register');
      supabase.rpc('record_community_affiliate_event', {
        _share_token: affiliateToken,
        _event_type: 'signup_started',
        _metadata: { source: 'connexion_page' },
        _referred_user_id: null,
      }).then(() => {});
    }

    const token = searchParams.get('invitation');
    if (token) {
      setInvitationToken(token);
      setMode('register');
      supabase.rpc('peek_event_invitation', { _token: token }).then(({ data }: any) => {
        if (data) {
          setInvitationInfo(data);
          if (data.valid) {
            setEmail(data.invited_email || '');
            setPrenom(data.invited_prenom || '');
          }
        }
      });
    }
  }, [searchParams]);

  const consumeInvitationIfAny = async () => {
    if (!invitationToken) return null;
    const { data } = await supabase.rpc('consume_event_invitation', { _token: invitationToken });
    return data as { success: boolean; event_id?: string; error?: string } | null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      toast.success('Bienvenue parmi les marcheurs ! 🌿');
      const consumed = await consumeInvitationIfAny();
      if (consumed?.success && consumed.event_id) {
        toast.success('Vous êtes rattaché·e à l\'événement comme Lecteur invité 📖');
        navigate(`/marches-du-vivant/mon-espace/exploration/${consumed.event_id}`);
        return;
      }
      // App choice : si l'utilisateur a accès à Mon Espace + une ou plusieurs propriétés,
      // on lui laisse le choix (dialogue). Une préférence localStorage court-circuite le dialogue.
      try {
        const { data: apps } = await supabase.rpc('get_user_apps_access');
        const list: ProprieteAccess[] = ((apps as any)?.proprietesAccessibles ?? []) as ProprieteAccess[];

        const pref = getDefaultAppTarget();
        if (pref === 'mon-espace') {
          navigate('/marches-du-vivant/mon-espace');
          return;
        }
        if (pref?.startsWith('propriete:')) {
          const slug = pref.slice('propriete:'.length);
          if (list.some((p) => p.slug === slug)) {
            navigate(`/propriete/${slug}`);
            return;
          }
        }

        if (list.length >= 1) {
          // Récupère le prénom pour personnaliser le dialogue.
          const { data: prof } = await supabase
            .from('community_profiles')
            .select('prenom')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
            .maybeSingle();
          setAppChoice({ open: true, prenom: prof?.prenom, proprietes: list });
          return;
        }
      } catch { /* fallback vers mon-espace */ }
      navigate('/marches-du-vivant/mon-espace');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentementAnalyse) {
      toast.error('Le consentement à l\'analyse d\'impact est nécessaire pour rejoindre la communauté.');
      return;
    }
    if (typesMarches.length === 0) {
      toast.error('Sélectionnez au moins un type de marche qui vous inspire 🌿');
      return;
    }
    if (typesMarches.includes('autre') && !autreTypeMarche.trim()) {
      toast.error('Précisez votre type de marche dans le champ « Autre ».');
      return;
    }
    setIsSubmitting(true);
    try {
      const affiliateToken = getStoredAffiliateToken() || undefined;
      await signUp({
        email, password, prenom, nom, ville, telephone,
        types_marches_interets: typesMarches,
        autre_type_marche: typesMarches.includes('autre') ? autreTypeMarche.trim() : undefined,
        recherche_prioritaire: recherchePrioritaire.trim() || undefined,
        consentement_analyse: consentementAnalyse,
        affiliateToken,
      });

      if (affiliateToken) {
        clearStoredAffiliateToken();
      }

      // If invitation present and user is now signed in (auto-login), consume immediately
      if (invitationToken) {
        // Try to sign in to consume the invitation right away
        try {
          await signIn(email, password);
          const consumed = await consumeInvitationIfAny();
          if (consumed?.success && consumed.event_id) {
            toast.success('Inscription réussie ! Vous découvrez l\'événement comme Lecteur invité 📖');
            navigate(`/marches-du-vivant/mon-espace/exploration/${consumed.event_id}`);
            return;
          }
        } catch {
          // confirmation requise — l'utilisateur consommera après confirmation email
        }
      }

      setEmailConfirmDialog({ open: true, email });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        toast.info('Aucun compte ne correspond à cet email. Rejoignez l\'aventure ! 🌿', {
          duration: 4000,
        });
        setTimeout(() => setMode('register'), 1500);
        return;
      }
      await resetPassword(email);
      toast.success('Email de réinitialisation envoyé ! 📧');
      setMode('login');
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Rejoindre la communauté | Les Marches du Vivant</title>
        <meta name="description" content="Créez votre compte pour participer aux Marches du Vivant et progresser du Marcheur à la Sentinelle." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 relative overflow-hidden flex flex-col">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-emerald-400 blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-teal-400 blur-[120px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 px-6 py-4">
          <Link to="/marches-du-vivant" className="inline-flex items-center gap-2 text-emerald-200/70 hover:text-emerald-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour</span>
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="w-full max-w-lg mx-auto"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-emerald-300 mb-2">
                <Leaf className="w-6 h-6" />
                <span className="text-lg font-medium tracking-wide">Les Marches du Vivant</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {mode === 'login' && 'Bon retour parmi nous'}
                {mode === 'register' && 'Rejoindre l\'aventure'}
                {mode === 'forgot' && 'Mot de passe oublié'}
              </h1>
              <p className="text-emerald-200/60 text-sm mt-1 text-center">
                {mode === 'login' && 'Le Vivant vous attend'}
                {mode === 'register' && 'Premier pas vers l\'écoute du vivant'}
                {mode === 'forgot' && 'Nous vous enverrons un lien de réinitialisation'}
              </p>
            </div>

            {/* Bandeau invitation Lecteur invité */}
            {invitationInfo && (
              <div className={`mb-4 rounded-xl border p-4 backdrop-blur-md ${
                invitationInfo.valid
                  ? 'bg-emerald-500/15 border-emerald-300/30 text-emerald-50'
                  : 'bg-amber-500/15 border-amber-300/30 text-amber-50'
              }`}>
                {invitationInfo.valid ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      📖 {invitationInfo.inviter_prenom || 'Un marcheur'} vous invite à découvrir
                      {invitationInfo.event_title ? ` « ${invitationInfo.event_title} »` : ' un événement'}
                    </p>
                    <p className="text-xs opacity-80">
                      Créez votre compte ou connectez-vous : vous serez automatiquement rattaché·e
                      comme <strong>Lecteur invité</strong> (lecture seule).
                    </p>
                  </div>
                ) : (
                  <p className="text-sm">
                    {invitationInfo.reason === 'expired' && '⏳ Cette invitation a expiré.'}
                    {invitationInfo.reason === 'already_consumed' && '✅ Cette invitation a déjà été utilisée.'}
                    {invitationInfo.reason === 'invalid_token' && '⚠️ Lien d\'invitation invalide.'}
                  </p>
                )}
              </div>
            )}

            {/* Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
              {/* Tabs */}
              {mode !== 'forgot' && (
                <div className="flex rounded-lg bg-white/5 p-1 mb-6">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 text-sm rounded-md transition-all ${mode === 'login' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-200/70 hover:text-white'}`}
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 text-sm rounded-md transition-all ${mode === 'register' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-200/70 hover:text-white'}`}
                  >
                    Inscription
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {mode === 'login' && (
                  <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-emerald-100 text-sm">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="votre@email.com" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-emerald-100 text-sm">Mot de passe</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                        <Input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300/50 hover:text-emerald-200">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-emerald-300/60 hover:text-emerald-200 transition-colors">
                      Mot de passe oublié ?
                    </button>
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white whitespace-normal text-center text-sm">
                      {isSubmitting ? 'Connexion...' : 'Se connecter'}
                    </Button>
                  </motion.form>
                )}

                {mode === 'register' && (
                  <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Essentials */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-emerald-100 text-sm">Prénom *</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                          <Input value={prenom} onChange={e => setPrenom(e.target.value)} required placeholder="Prénom" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-emerald-100 text-sm">Nom *</Label>
                        <Input value={nom} onChange={e => setNom(e.target.value)} required placeholder="Nom" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-emerald-100 text-sm">Email *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="votre@email.com" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-emerald-100 text-sm">Mot de passe *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                        <Input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="6 caractères minimum" className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300/50 hover:text-emerald-200">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-emerald-100 text-sm">Ville</Label>
                        <div className="relative mt-1">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                          <Input value={ville} onChange={e => setVille(e.target.value)} placeholder="Votre ville" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-emerald-100 text-sm">Téléphone</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                          <Input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06..." className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                        </div>
                      </div>
                    </div>

                    {/* Intentions de marche */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-emerald-200">Vos intentions de marche</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-emerald-100 text-sm">
                            Quels types de marches vous inspirent ? <span className="text-emerald-300/60">(au moins un choix, plusieurs possibles)</span>
                          </Label>
                          <div className="mt-2 space-y-2">
                            {TYPE_MARCHE_OPTIONS.map((opt) => {
                              const checked = typesMarches.includes(opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  htmlFor={`type-${opt.value}`}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    checked
                                      ? 'bg-emerald-500/15 border-emerald-400/40'
                                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                                  }`}
                                >
                                  <Checkbox
                                    id={`type-${opt.value}`}
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                      setTypesMarches((prev) =>
                                        c ? [...prev, opt.value] : prev.filter((v) => v !== opt.value),
                                      );
                                    }}
                                    className="mt-0.5 border-emerald-300/50 data-[state=checked]:bg-emerald-500"
                                  />
                                  <span className="text-sm text-emerald-100 leading-tight">
                                    {opt.label}
                                    {opt.hint && (
                                      <span className="block text-xs text-emerald-300/60 mt-0.5">{opt.hint}</span>
                                    )}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {typesMarches.includes('autre') && (
                            <div className="mt-3">
                              <Input
                                value={autreTypeMarche}
                                onChange={(e) => setAutreTypeMarche(e.target.value)}
                                maxLength={150}
                                placeholder=""
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-emerald-100 text-sm">
                            Que recherchez-vous en priorité lors de vos prochaines marches du vivant ?
                          </Label>
                          <Textarea
                            value={recherchePrioritaire}
                            onChange={(e) => setRecherchePrioritaire(e.target.value)}
                            maxLength={600}
                            placeholder="Reconnecter une équipe au vivant, mesurer notre impact local, prendre le temps d'observer, nourrir une démarche RSE…"
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consentements */}
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
                        <Checkbox
                          id="consent-analyse"
                          checked={consentementAnalyse}
                          onCheckedChange={(checked) => setConsentementAnalyse(!!checked)}
                          className="mt-0.5 border-emerald-300/50 data-[state=checked]:bg-emerald-500"
                          required
                        />
                        <label htmlFor="consent-analyse" className="text-sm text-emerald-100 leading-relaxed cursor-pointer">
                          <span className="font-medium">Je consens</span> à ce que mes réponses contribuent, de manière anonymisée, à mesurer l'impact des Marches du Vivant et à accélérer les démarches de transition environnementale.
                          <span className="block text-xs text-emerald-300/60 mt-1">
                            Obligatoire (RGPD). Données conservées le temps de votre participation, jamais revendues. Vous pouvez retirer ce consentement à tout moment depuis votre espace.
                          </span>
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <Checkbox
                          id="engagement"
                          checked={engagement}
                          onCheckedChange={(checked) => setEngagement(!!checked)}
                          className="mt-0.5 border-emerald-300/50 data-[state=checked]:bg-emerald-500"
                        />
                        <label htmlFor="engagement" className="text-sm text-emerald-100 leading-relaxed cursor-pointer">
                          Je promets de lever les yeux de mon écran au moins une fois pendant la marche 🌿
                          <span className="block text-xs text-emerald-300/50 mt-1">
                            (Facultatif — notre signature d'âme)
                          </span>
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !consentementAnalyse || typesMarches.length === 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? 'Inscription...' : 'Devenir Marcheur en devenir 🌱'}
                    </Button>
                  </motion.form>
                )}

                {mode === 'forgot' && (
                  <motion.form key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <Label className="text-emerald-100 text-sm">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="votre@email.com" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white">
                      {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
                    </Button>
                    <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-emerald-300/60 hover:text-emerald-200 transition-colors">
                      ← Retour à la connexion
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={emailConfirmDialog.open} onOpenChange={(open) => {
        setEmailConfirmDialog({ ...emailConfirmDialog, open });
        if (!open) setMode('login');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-2">
              <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-300" />
            </div>
            <DialogTitle className="text-center text-xl">Vérifiez votre boîte mail 📬</DialogTitle>
            <DialogDescription className="text-center pt-2 space-y-2">
              <span className="block">
                Un lien de confirmation vient d'être envoyé à <strong className="text-foreground">{emailConfirmDialog.email}</strong>.
              </span>
              <span className="block">
                Cliquez dessus pour activer votre compte, puis revenez ici pour vous connecter.
              </span>
              <span className="block text-xs text-muted-foreground italic pt-2">
                Pensez à vérifier vos spams si vous ne le voyez pas dans quelques minutes.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              disabled={resendingEmail}
              onClick={async () => {
                setResendingEmail(true);
                try {
                  const { error } = await supabase.auth.resend({ type: 'signup', email: emailConfirmDialog.email });
                  if (error) throw error;
                  toast.success('Email renvoyé ! 📧');
                } catch (e: any) {
                  toast.error(e.message || 'Erreur lors du renvoi');
                } finally {
                  setResendingEmail(false);
                }
              }}
              className="w-full"
            >
              {resendingEmail ? 'Envoi…' : 'Renvoyer l\'email de confirmation'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEmailConfirmDialog({ open: false, email: '' });
                setMode('login');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              J'ai compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppChoiceDialog
        open={appChoice.open}
        onOpenChange={(v) => setAppChoice((s) => ({ ...s, open: v }))}
        prenom={appChoice.prenom}
        proprietes={appChoice.proprietes}
      />
    </>

  );
};

export default MarchesDuVivantConnexion;
