import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Leaf, Cpu, Users, Footprints, Map, TrendingUp,
  Printer, Share2, Calendar, ChevronRight, Sparkles, Eye, Shield, Heart
} from 'lucide-react';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }
  })
};

/* Decorative botanical leaf SVG — used as background ornament */
const BotanicalLeaf = ({ className = '', flip = false }: { className?: string; flip?: boolean }) => (
  <svg className={className} viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M60 10C60 10 20 60 20 120C20 160 40 190 60 190C80 190 100 160 100 120C100 60 60 10 60 10Z" 
      fill="currentColor" opacity="0.06" />
    <path d="M60 30C60 30 60 190 60 190" stroke="currentColor" strokeWidth="0.8" opacity="0.12" />
    <path d="M60 60C45 70 30 90 28 110" stroke="currentColor" strokeWidth="0.5" opacity="0.08" fill="none" />
    <path d="M60 80C75 90 90 100 92 120" stroke="currentColor" strokeWidth="0.5" opacity="0.08" fill="none" />
    <path d="M60 110C42 118 32 135 30 150" stroke="currentColor" strokeWidth="0.5" opacity="0.08" fill="none" />
    <path d="M60 130C78 138 88 148 90 160" stroke="currentColor" strokeWidth="0.5" opacity="0.08" fill="none" />
  </svg>
);

/* Delicate divider with botanical dot */
const SectionDivider = () => (
  <div className="flex items-center justify-center gap-4 py-2">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-300/40" />
    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-300/40" />
  </div>
);

const MarchesDuVivantExplorer = () => {
  const handlePrint = () => window.print();
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Devenez Marcheur du Vivant', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié dans le presse-papier');
      }
    } catch { /* user cancelled */ }
  };

  const piliers = [
    {
      icon: <Leaf className="w-6 h-6" />,
      titre: 'Géopoétique du Vivant',
      accent: 'from-emerald-600 to-teal-600',
      bg: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/60',
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-100/80 text-emerald-700',
      texte: "La marche n'est pas un sport, c'est une expérience du territoire. Chaque pas est un acte poétique et scientifique. Le marcheur écoute, ressens, nomme, témoigne."
    },
    {
      icon: <Users className="w-6 h-6" />,
      titre: 'Science Participative',
      accent: 'from-amber-600 to-orange-600',
      bg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/60',
      border: 'border-amber-200/60',
      iconBg: 'bg-amber-100/80 text-amber-700',
      texte: "Chaque observation rejoint une base de connaissance collective. Vous contribuez à la cartographie du vivant, pour les scientifiques et pour les générations futures."
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      titre: 'Technologie Frugale',
      accent: 'from-sky-600 to-indigo-600',
      bg: 'bg-gradient-to-br from-sky-50/80 to-indigo-50/60',
      border: 'border-sky-200/60',
      iconBg: 'bg-sky-100/80 text-sky-700',
      texte: "Pas de surconsommation de données. L'application traite ce que le marcheur rapporte avec sobriété et précision. L'IA est au service du vivant, pas l'inverse."
    }
  ];

  const etapes = [
    { num: '01', icon: <Footprints className="w-5 h-5" />, titre: 'Marchez', texte: "Choisissez un sentier, une forêt, une rivière, un parc, ouvrez l'application, marchez. Chaque kilomètre vous rapporte des Fréquences." },
    { num: '02', icon: <Map className="w-5 h-5" />, titre: 'Explorez les zones blanches', texte: "Les zones pauvres en données rapportent jusqu'à 4× plus de Fréquences. Devenez éclaireur du vivant." },
    { num: '03', icon: <TrendingUp className="w-5 h-5" />, titre: 'Progressez', texte: "Maintenez votre série hebdomadaire, montez dans le classement, débloquez de nouveaux rôles." },
  ];

  const roles = [
    { nom: 'Marcheur', desc: 'Première marche, découverte de l\'écoute active', icon: <Footprints className="w-5 h-5" />, color: 'text-emerald-600' },
    { nom: 'Éclaireur', desc: '5 zones blanches explorées', icon: <Eye className="w-5 h-5" />, color: 'text-teal-600' },
    { nom: 'Ambassadeur', desc: 'Formation + animation de groupes', icon: <Heart className="w-5 h-5" />, color: 'text-sky-600' },
    { nom: 'Sentinelle', desc: 'Référent territorial, formateur', icon: <Shield className="w-5 h-5" />, color: 'text-amber-600' },
  ];

  const calendrier = [
    { date: '8-9 mars 2026', label: 'Premier test', desc: 'Printemps des Poètes — comité réduit', status: 'upcoming' },
    { date: '24-25 mai 2026', label: 'Second test', desc: 'Fête de la Nature — comité élargi', status: 'planned' },
    { date: '21 juin 2026', label: 'Lancement officiel', desc: 'Solstice d\'été — ouverture à tous', status: 'launch' },
  ];

  const zones = [
    { zone: 'Zone fréquentée', mult: '×1', pct: 25 },
    { zone: 'Peu fréquentée', mult: '×2', pct: 50 },
    { zone: 'Zone blanche', mult: '×4', pct: 100 },
  ];

  return (
    <>
      <Helmet>
        <title>Devenez Marcheur du Vivant — Les Marches du Vivant</title>
        <meta name="description" content="Marchez, écoutez, témoignez. Rejoignez gratuitement les Marcheurs du Vivant et contribuez à la connaissance de la biodiversité." />
      </Helmet>

      <div className="min-h-screen print-plaquette" style={{ background: 'linear-gradient(180deg, #fefdfb 0%, #f8f6f0 30%, #fefdfb 60%, #f5f3ed 100%)' }}>

        {/* === NAV === */}
        <nav className="print:hidden sticky top-0 z-50 backdrop-blur-md border-b border-stone-200/50" style={{ background: 'rgba(254,253,251,0.92)' }}>
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link to="/marches-du-vivant" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Les Marches du Vivant</span>
            </Link>
            <div className="flex items-center gap-1">
              <button onClick={handleShare} className="p-2.5 rounded-xl hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600" title="Partager">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={handlePrint} className="p-2.5 rounded-xl hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600" title="Imprimer / PDF">
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* === HERO === */}
        <section className="relative pt-10 pb-10 md:pt-16 md:pb-14 px-6 text-center overflow-hidden">
          {/* Botanical ornaments */}
          <BotanicalLeaf className="absolute top-8 left-4 md:left-16 w-20 md:w-28 text-emerald-800 print:hidden" />
          <BotanicalLeaf className="absolute top-12 right-4 md:right-16 w-16 md:w-24 text-emerald-800 print:hidden" flip />
          <BotanicalLeaf className="absolute bottom-0 left-1/4 w-14 text-emerald-700 opacity-50 print:hidden" />
          
          {/* Soft radial glow */}
          <div className="absolute inset-0 print:hidden" style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(16,185,129,0.06) 0%, transparent 70%)'
          }} />

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="relative max-w-3xl mx-auto">
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(20,184,166,0.08) 100%)', color: '#047857', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gratuit · Ouvert à tous
            </motion.span>
            
            <h1 className="font-crimson text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] mb-5" 
              style={{ color: '#1a1a18' }}>
              Devenez<br />
              <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                Marcheur du Vivant
              </span>
            </h1>
            
            <div className="flex justify-center mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            </div>
            
            <p className="font-crimson text-lg md:text-xl italic leading-relaxed mb-5 text-center" style={{ color: '#6b7280' }}>
              « Chaque pas est un acte poétique et scientifique »
            </p>
            
            <p className="text-sm md:text-base leading-[1.7] max-w-xl mx-auto text-center" style={{ color: '#4b5563' }}>
              Vous allez écouter, apprendre à reconnaître, nommer, témoigner. 
              Et chaque kilomètre parcouru enrichira votre connaissance du vivant.
            </p>
          </motion.div>
        </section>

        <SectionDivider />

        {/* === PILIERS === */}
        <section className="py-10 md:py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-600/70 mb-4">Les fondations</p>
              <h2 className="font-crimson text-2xl md:text-4xl font-semibold mb-3" style={{ color: '#1a1a18' }}>
                Pourquoi marcher pour le vivant&nbsp;?
              </h2>
              <p className="text-stone-500 max-w-lg mx-auto text-sm leading-relaxed text-center">
                Trois piliers fondateurs, un seul objectif&nbsp;: relier l'humain au territoire.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-5 md:gap-6">
              {piliers.map((p, i) => (
                <motion.div key={p.titre} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className={`relative rounded-2xl border ${p.border} ${p.bg} p-5 md:p-6 print-card backdrop-blur-sm overflow-hidden group`}>
                  {/* Subtle corner ornament */}
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04] print:hidden"
                    style={{ background: `radial-gradient(circle at 100% 0%, currentColor 0%, transparent 70%)` }} />
                  
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${p.iconBg} shadow-sm`}>
                    {p.icon}
                  </div>
                  <h3 className={`font-semibold text-base md:text-lg mb-3 bg-gradient-to-r ${p.accent} bg-clip-text text-transparent`}>
                    {p.titre}
                  </h3>
                  <p className="text-sm leading-[1.7] text-stone-600 text-left">{p.texte}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* === COMMENT CA MARCHE === */}
        <section className="py-10 md:py-16 px-6 relative overflow-hidden">
          <div className="absolute inset-0 print:hidden" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(245,243,237,0.8) 50%, rgba(251,191,36,0.02) 100%)'
          }} />
          
          <div className="max-w-4xl mx-auto relative">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-600/70 mb-4">Le parcours</p>
              <h2 className="font-crimson text-2xl md:text-4xl font-semibold mb-3" style={{ color: '#1a1a18' }}>
                Comment ça marche&nbsp;?
              </h2>
              <p className="text-stone-500 max-w-md mx-auto text-sm leading-relaxed">
                Trois étapes pour devenir acteur de la connaissance du vivant.
              </p>
            </motion.div>
            
            <div className="space-y-4">
              {etapes.map((e, i) => (
                <motion.div key={e.num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className="flex gap-4 md:gap-5 items-start p-4 md:p-5 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(214,211,199,0.3)' }}>
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <span className="bg-gradient-to-br from-emerald-700 to-teal-600 bg-clip-text text-transparent font-bold text-lg">{e.num}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base md:text-lg mb-1.5 flex items-center gap-2 text-stone-800">
                      <span className="text-emerald-600">{e.icon}</span>
                      {e.titre}
                    </h3>
                    <p className="text-stone-600 text-sm leading-[1.7] text-left">{e.texte}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* === PROGRESSION === */}
        <section className="py-10 md:py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-600/70 mb-4">L'évolution</p>
              <h2 className="font-crimson text-2xl md:text-4xl font-semibold mb-3" style={{ color: '#1a1a18' }}>
                Votre progression
              </h2>
              <p className="text-stone-500 max-w-md mx-auto text-sm leading-relaxed">
                Quatre rôles à incarner, du premier pas jusqu'à la transmission.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {roles.map((r, i) => (
                <motion.div key={r.nom} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className="relative text-center p-5 md:p-6 rounded-2xl print-card group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(214,211,199,0.35)', backdropFilter: 'blur(8px)' }}>
                  <div className={`w-10 h-10 rounded-lg ${r.color} bg-gradient-to-br from-stone-50 to-white flex items-center justify-center mx-auto mb-3 shadow-sm`}
                    style={{ border: '1px solid rgba(214,211,199,0.3)' }}>
                    {r.icon}
                  </div>
                  <h4 className="font-semibold text-base mb-1.5 text-stone-800">{r.nom}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">{r.desc}</p>
                  
                  {/* Connecting arrow between cards */}
                  {i < roles.length - 1 && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center z-10 print:hidden">
                      <ChevronRight className="w-5 h-5 text-emerald-400/50" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* === ZONES BLANCHES === */}
        <section className="py-10 md:py-16 px-6 relative overflow-hidden">
          <div className="absolute inset-0 print:hidden" style={{
            background: 'linear-gradient(180deg, rgba(245,243,237,0.5) 0%, rgba(254,253,251,1) 100%)'
          }} />
          <BotanicalLeaf className="absolute bottom-4 right-8 w-20 text-emerald-700 opacity-40 print:hidden" flip />

          <div className="max-w-4xl mx-auto relative">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-600/70 mb-4">Le cœur du défi</p>
              <h2 className="font-crimson text-2xl md:text-4xl font-semibold mb-3" style={{ color: '#1a1a18' }}>
                Les zones blanches
              </h2>
            </motion.div>
            
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              className="rounded-2xl p-6 md:p-8 mb-8"
              style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(214,211,199,0.3)', backdropFilter: 'blur(8px)' }}>
              <p className="text-stone-600 text-base leading-[1.8] text-left font-crimson text-lg">
                Les zones blanches sont des territoires où la biodiversité n'a pas encore été écoutée. 
                Aucune donnée, aucun témoignage. En vous y rendant, vous devenez le <em>premier éclaireur</em>. 
                Et vos <strong className="text-emerald-700">Fréquences</strong> sont multipliées.
              </p>
            </motion.div>
            
            <div className="max-w-lg mx-auto space-y-3">
              {zones.map((z, i) => (
                <motion.div key={z.zone} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 2}
                  className="flex items-center gap-5">
                  <span className="text-sm text-stone-600 w-36 text-right font-medium">{z.zone}</span>
                  <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(214,211,199,0.2)', border: '1px solid rgba(214,211,199,0.2)' }}>
                    <motion.div 
                      initial={{ width: 0 }} 
                      whileInView={{ width: `${z.pct}%` }} 
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                      className="h-full rounded-lg flex items-center justify-end pr-3"
                      style={{ background: `linear-gradient(135deg, #10b981 0%, #0d9488 100%)` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-sm">{z.mult}</span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* === CALENDRIER === */}
        <section className="py-10 md:py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-600/70 mb-4">Les rendez-vous</p>
              <h2 className="font-crimson text-2xl md:text-4xl font-semibold mb-3" style={{ color: '#1a1a18' }}>
                Calendrier de lancement
              </h2>
              <p className="text-stone-500 max-w-md mx-auto text-sm leading-relaxed">
                Trois temps forts pour construire ensemble.
              </p>
            </motion.div>
            
            <div className="relative">
              <div className="absolute left-7 md:left-9 top-0 bottom-0 w-px print:bg-gray-300"
                style={{ background: 'linear-gradient(to bottom, rgba(16,185,129,0.3), rgba(16,185,129,0.1))' }} />
              
              <div className="space-y-6">
                {calendrier.map((c, i) => (
                  <motion.div key={c.date} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                    className="flex gap-6 items-start relative">
                    <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center z-10 shadow-sm"
                      style={{ 
                        background: c.status === 'launch' 
                          ? 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' 
                          : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)',
                        border: c.status === 'launch' ? 'none' : '1px solid rgba(16,185,129,0.2)'
                      }}>
                      <Calendar className={`w-5 h-5 md:w-6 md:h-6 ${c.status === 'launch' ? 'text-white' : 'text-emerald-700'}`} />
                    </div>
                    <div className="pt-1.5 flex-1">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">{c.date}</p>
                      <h4 className="font-semibold text-lg text-stone-800 mb-0.5">{c.label}</h4>
                      <p className="text-sm text-stone-500">{c.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* === CTA FINAL === */}
        <section className="py-14 md:py-20 px-6 relative overflow-hidden print:bg-white print:border-t print:border-gray-200">
          <div className="absolute inset-0 print:hidden" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(245,243,237,0.9) 40%, rgba(20,184,166,0.04) 100%)'
          }} />
          <BotanicalLeaf className="absolute top-8 left-8 w-16 text-emerald-700 opacity-40 print:hidden" />
          <BotanicalLeaf className="absolute bottom-4 right-12 w-20 text-emerald-700 opacity-30 print:hidden" flip />

          <div className="max-w-3xl mx-auto text-center relative">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
              <div className="w-12 h-12 rounded-xl mx-auto mb-6 flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              
              <h2 className="font-crimson text-2xl md:text-4xl font-semibold mb-4" style={{ color: '#1a1a18' }}>
                Rejoignez les premiers<br />
                <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Marcheurs du Vivant
                </span>
              </h2>
              
              <p className="text-stone-500 mb-6 text-sm tracking-wide">
                Gratuit · Intergénérationnel · Ouvert à tous
              </p>
              
              <a
                href="https://la-frequence-du-vivant.lovable.app/contact"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-white font-medium text-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 print:shadow-none print:border print:border-gray-400 print:bg-white print:text-gray-900"
                style={{ 
                  background: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.25), 0 2px 8px rgba(16,185,129,0.15)'
                }}
              >
                Rejoindre l'aventure
                <ChevronRight className="w-4 h-4" />
              </a>
              
              <p className="mt-5 text-xs text-stone-400 font-medium tracking-wide">
                la-frequence-du-vivant.lovable.app/contact
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MarchesDuVivantExplorer;
