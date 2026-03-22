import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Leaf, Mail, Lock, User, MapPin, Phone, Calendar, Sparkles, Eye, EyeOff, TreePine, Ear, Flower2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import Footer from '@/components/Footer';

const KIGO_OPTIONS = [
  { value: 'parle_aux_arbres', label: '🌳 Je parle déjà aux arbres' },
  { value: 'transition_beton', label: '🏗️ En transition depuis le béton' },
  { value: 'curieux_vivant', label: '🦋 Curieux·se du vivant' },
  { value: 'expert_canape', label: '🛋️ Expert·e en canapé (mais motivé·e)' },
];

const SUPERPOUVOIR_OPTIONS = [
  { value: 'vue', label: '👁️ La vue — je repère un rapace à 2 km' },
  { value: 'ouie', label: '👂 L\'ouïe — je distingue un merle d\'une grive' },
  { value: 'odorat', label: '👃 L\'odorat — je sens la pluie avant les nuages' },
  { value: 'sixieme_sens', label: '🌧️ Sixième sens pour la pluie' },
];

const INTIMITE_OPTIONS = [
  { value: 'cactus', label: '🌵 Un cactus, ça compte ?' },
  { value: 'randonneur', label: '🥾 Randonneur·se du dimanche' },
  { value: 'naturaliste', label: '🔬 Naturaliste assumé·e' },
  { value: 'druide', label: '🧙 Druide certifié·e' },
];

const MarchesDuVivantConnexion = () => {
  const navigate = useNavigate();
  const { signUp, signIn, resetPassword } = useCommunityAuth();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      toast.success('Bienvenue parmi les marcheurs ! 🌿');
      navigate('/marches-du-vivant/mon-espace');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engagement) {
      toast.error('Veuillez accepter l\'engagement poétique 🌱');
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp({
        email, password, prenom, nom, ville, telephone,
        date_naissance: dateNaissance || undefined,
        motivation: motivation || undefined,
        kigo_accueil: kigo || undefined,
        superpouvoir_sensoriel: superpouvoir || undefined,
        niveau_intimite_vivant: intimite || undefined,
      });
      toast.success('Inscription réussie ! Vérifiez vos emails pour confirmer votre compte 📬');
      setMode('login');
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
                {mode === 'login' && 'Les sentiers vous attendent'}
                {mode === 'register' && 'Premier pas vers l\'écoute du vivant'}
                {mode === 'forgot' && 'Nous vous enverrons un lien de réinitialisation'}
              </p>
            </div>

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
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white">
                      {isSubmitting ? 'Connexion...' : 'Rejoignez la communauté des marcheurs du vivant'}
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

                    <div>
                      <Label className="text-emerald-100 text-sm">Date de naissance</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                        <Input value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} type="date" className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                      </div>
                    </div>

                    {/* Creative section */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-emerald-200">Un peu de poésie...</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-emerald-100 text-sm">Votre relation actuelle avec le vivant ?</Label>
                          <Select value={kigo} onValueChange={setKigo}>
                            <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Choisissez votre kigo d'accueil" />
                            </SelectTrigger>
                            <SelectContent>
                              {KIGO_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-emerald-100 text-sm">Votre superpouvoir sensoriel ?</Label>
                          <Select value={superpouvoir} onValueChange={setSuperpouvoir}>
                            <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Quel sens vous guide ?" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPERPOUVOIR_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-emerald-100 text-sm">Votre niveau d'intimité avec la nature ?</Label>
                          <Select value={intimite} onValueChange={setIntimite}>
                            <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Soyez honnête..." />
                            </SelectTrigger>
                            <SelectContent>
                              {INTIMITE_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-emerald-100 text-sm">Qu'est-ce qui vous motive ?</Label>
                          <Textarea value={motivation} onChange={e => setMotivation(e.target.value)} placeholder="Racontez-nous..." className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none" rows={2} />
                        </div>
                      </div>
                    </div>

                    {/* Poetic engagement */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                        <Checkbox
                          id="engagement"
                          checked={engagement}
                          onCheckedChange={(checked) => setEngagement(!!checked)}
                          className="mt-0.5 border-emerald-300/50 data-[state=checked]:bg-emerald-500"
                        />
                        <label htmlFor="engagement" className="text-sm text-emerald-100 leading-relaxed cursor-pointer">
                          Je promets de lever les yeux de mon écran au moins une fois pendant la marche 🌿
                          <span className="block text-xs text-emerald-300/50 mt-1">
                            (C'est notre seule condition d'utilisation)
                          </span>
                        </label>
                      </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white">
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
    </>
  );
};

export default MarchesDuVivantConnexion;
