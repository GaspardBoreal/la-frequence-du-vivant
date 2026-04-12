import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpenText, Share2, User, MapPin, Copy, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface TextesEcritsSubTabProps {
  explorationId?: string;
  marcheEventId?: string;
}

interface TexteRow {
  id: string;
  user_id: string;
  marche_id: string | null;
  marche_event_id: string;
  type_texte: string;
  titre: string;
  contenu: string;
  is_public: boolean;
  ordre: number | null;
  created_at: string;
  author_prenom?: string;
  author_nom?: string;
  author_avatar?: string | null;
}

interface AuthorInfo {
  user_id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
}

type ViewMode = 'marcheurs' | 'points';

interface MarcheInfo {
  id: string;
  nom_marche: string | null;
  ville: string;
  ordre: number;
}

const TextesEcritsSubTab: React.FC<TextesEcritsSubTabProps> = ({ explorationId, marcheEventId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('marcheurs');
  const [selectedTexte, setSelectedTexte] = useState<TexteRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch texts + author info via RPC (bypasses RLS on community_profiles)
  const { data: textes = [] } = useQuery({
    queryKey: ['event-textes-ecrits', marcheEventId],
    queryFn: async () => {
      if (!marcheEventId) return [];
      const { data, error } = await supabase.rpc('get_event_public_textes', {
        p_event_id: marcheEventId,
      });
      if (error) throw error;
      return (data || []) as unknown as TexteRow[];
    },
    enabled: !!marcheEventId,
  });

  // Build authorMap from embedded author fields
  const authorMap = useMemo(() => {
    const m = new Map<string, AuthorInfo>();
    textes.forEach(t => {
      if (!m.has(t.user_id)) {
        m.set(t.user_id, {
          user_id: t.user_id,
          prenom: t.author_prenom || '',
          nom: t.author_nom || '',
          avatar_url: t.author_avatar ?? null,
        });
      }
    });
    return m;
  }, [textes]);

  // Fetch marche points with ordre
  const marcheIds = useMemo(() => [...new Set(textes.filter(t => t.marche_id).map(t => t.marche_id!))], [textes]);
  const { data: marches = [] } = useQuery({
    queryKey: ['textes-marches', explorationId, marcheIds],
    queryFn: async () => {
      if (!explorationId || !marcheIds.length) return [];
      const { data: links } = await supabase
        .from('exploration_marches')
        .select('marche_id, ordre')
        .eq('exploration_id', explorationId)
        .in('marche_id', marcheIds);
      if (!links?.length) return [];
      const { data: marchesData } = await supabase
        .from('marches')
        .select('id, nom_marche, ville')
        .in('id', marcheIds);
      if (!marchesData) return [];
      const ordreMap: Record<string, number> = {};
      links.forEach(l => { ordreMap[l.marche_id] = l.ordre ?? 0; });
      return marchesData.map(m => ({
        id: m.id,
        nom_marche: m.nom_marche,
        ville: m.ville,
        ordre: ordreMap[m.id] ?? 0,
      })).sort((a, b) => a.ordre - b.ordre) as MarcheInfo[];
    },
    enabled: !!explorationId && marcheIds.length > 0,
  });

  const marcheMap = useMemo(() => {
    const m = new Map<string, MarcheInfo>();
    marches.forEach(mc => m.set(mc.id, mc));
    return m;
  }, [marches]);

  // Auto-open from URL
  useEffect(() => {
    const texteId = searchParams.get('texte');
    if (texteId && textes.length) {
      const found = textes.find(t => t.id === texteId);
      if (found) setSelectedTexte(found);
    }
  }, [searchParams, textes]);

  // Grouped data
  const groupedByAuthor = useMemo(() => {
    const groups = new Map<string, TexteRow[]>();
    textes.forEach(t => {
      const list = groups.get(t.user_id) || [];
      list.push(t);
      groups.set(t.user_id, list);
    });
    return [...groups.entries()]
      .map(([userId, texts]) => ({ author: authorMap.get(userId), texts }))
      .sort((a, b) => {
        const na = `${a.author?.prenom || ''} ${a.author?.nom || ''}`.trim().toLowerCase();
        const nb = `${b.author?.prenom || ''} ${b.author?.nom || ''}`.trim().toLowerCase();
        return na.localeCompare(nb);
      });
  }, [textes, authorMap]);

  const groupedByPoint = useMemo(() => {
    const groups = new Map<string, TexteRow[]>();
    textes.forEach(t => {
      const key = t.marche_id || 'unknown';
      const list = groups.get(key) || [];
      list.push(t);
      groups.set(key, list);
    });
    return [...groups.entries()]
      .map(([marcheId, texts]) => ({
        marche: marcheMap.get(marcheId),
        marcheId,
        texts: texts.sort((a, b) => {
          const na = `${authorMap.get(a.user_id)?.prenom || ''} ${authorMap.get(a.user_id)?.nom || ''}`.toLowerCase();
          const nb = `${authorMap.get(b.user_id)?.prenom || ''} ${authorMap.get(b.user_id)?.nom || ''}`.toLowerCase();
          return na.localeCompare(nb);
        }),
      }))
      .sort((a, b) => (a.marche?.ordre ?? 99) - (b.marche?.ordre ?? 99));
  }, [textes, marcheMap, authorMap]);

  const handleShare = (texteId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?texte=${texteId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Lien copié dans le presse-papier');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenTexte = (texte: TexteRow) => {
    setSelectedTexte(texte);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('texte', texte.id);
      return next;
    }, { replace: true });
  };

  const handleCloseTexte = () => {
    setSelectedTexte(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('texte');
      return next;
    }, { replace: true });
  };

  if (!textes.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/5 border border-violet-500/15 flex items-center justify-center mb-4">
          <BookOpenText className="w-7 h-7 text-violet-400/60" />
        </div>
        <h3 className="text-foreground text-sm font-semibold mb-1">Aucun texte partagé</h3>
        <p className="text-muted-foreground text-xs max-w-xs">Les textes écrits par les marcheurs lors de cet événement apparaîtront ici.</p>
      </motion.div>
    );
  }

  const selectedAuthor = selectedTexte ? authorMap.get(selectedTexte.user_id) : null;
  const selectedMarche = selectedTexte?.marche_id ? marcheMap.get(selectedTexte.marche_id) : null;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl w-fit">
        {([
          { key: 'marcheurs' as ViewMode, label: 'Marcheurs' },
          { key: 'points' as ViewMode, label: 'Points de marche' },
        ]).map(v => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === v.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'marcheurs' ? (
          <motion.div key="marcheurs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {groupedByAuthor.map(({ author, texts }) => (
              <AuthorAccordion
                key={author?.user_id || 'unknown'}
                author={author}
                texts={texts}
                marcheMap={marcheMap}
                onSelectTexte={handleOpenTexte}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div key="points" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {groupedByPoint.map(({ marche, marcheId, texts }) => (
              <PointAccordion
                key={marcheId}
                marche={marche}
                texts={texts}
                authorMap={authorMap}
                onSelectTexte={handleOpenTexte}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup texte */}
      <Dialog open={!!selectedTexte} onOpenChange={(open) => { if (!open) handleCloseTexte(); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
          {selectedTexte && (
            <div className="relative">
              {/* Violet left accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-lg" />
              <div className="pl-6 pr-6 py-6">
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-medium">
                      {selectedTexte.type_texte}
                    </span>
                    {selectedMarche && (
                      <span className="flex items-center gap-1 text-muted-foreground text-[10px]">
                        <MapPin className="w-3 h-3" />
                        {selectedMarche.nom_marche || selectedMarche.ville}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="font-serif text-xl leading-tight">
                    {selectedTexte.titre}
                  </DialogTitle>
                  {selectedAuthor && (
                    <DialogDescription className="flex items-center gap-2 mt-2">
                      <AuthorAvatar author={selectedAuthor} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        {selectedAuthor.prenom} {selectedAuthor.nom}
                      </span>
                    </DialogDescription>
                  )}
                </DialogHeader>

                <div className="font-serif text-base leading-relaxed text-foreground whitespace-pre-line italic py-4 border-t border-border/50">
                  {selectedTexte.contenu}
                </div>

                <div className="flex justify-end pt-4 border-t border-border/50">
                  <button
                    onClick={() => handleShare(selectedTexte.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Lien copié !' : 'Copier le lien'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Sub-components ---

const AuthorAvatar: React.FC<{ author: AuthorInfo | undefined; size?: 'sm' | 'md' }> = ({ author, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  if (author?.avatar_url) {
    return <img src={author.avatar_url} alt="" className={`${dim} rounded-full object-cover`} />;
  }
  const initials = `${(author?.prenom || '?')[0]}${(author?.nom || '')[0] || ''}`.toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold`}>
      {initials}
    </div>
  );
};

const TexteCard: React.FC<{
  texte: TexteRow;
  author?: AuthorInfo;
  marche?: MarcheInfo;
  showAuthor?: boolean;
  showMarche?: boolean;
  onClick: () => void;
}> = ({ texte, author, marche, showAuthor = false, showMarche = false, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5 transition-all group"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[9px] font-medium">
            {texte.type_texte}
          </span>
          {showMarche && marche && (
            <span className="flex items-center gap-0.5 text-muted-foreground text-[9px] truncate">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {marche.nom_marche || marche.ville}
            </span>
          )}
        </div>
        <h4 className="font-serif text-sm font-semibold text-foreground leading-snug mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {texte.titre}
        </h4>
        <p className="text-xs text-muted-foreground italic line-clamp-3 leading-relaxed">
          {texte.contenu}
        </p>
        {showAuthor && author && (
          <div className="flex items-center gap-1.5 mt-2">
            <AuthorAvatar author={author} size="sm" />
            <span className="text-[10px] text-muted-foreground font-medium">{author.prenom} {author.nom}</span>
          </div>
        )}
      </div>
      <BookOpenText className="w-4 h-4 text-violet-400/30 group-hover:text-violet-400/60 transition-colors shrink-0 mt-1" />
    </div>
  </button>
);

const AuthorAccordion: React.FC<{
  author: AuthorInfo | undefined;
  texts: TexteRow[];
  marcheMap: Map<string, MarcheInfo>;
  onSelectTexte: (t: TexteRow) => void;
}> = ({ author, texts, marcheMap, onSelectTexte }) => {
  const [open, setOpen] = useState(true);
  const name = author ? `${author.prenom} ${author.nom}` : 'Auteur inconnu';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
        <AuthorAvatar author={author} />
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{texts.length} texte{texts.length > 1 ? 's' : ''}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-2 mt-2 pl-2">
          {texts.map(t => (
            <TexteCard
              key={t.id}
              texte={t}
              marche={t.marche_id ? marcheMap.get(t.marche_id) : undefined}
              showMarche
              onClick={() => onSelectTexte(t)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const PointAccordion: React.FC<{
  marche: MarcheInfo | undefined;
  texts: TexteRow[];
  authorMap: Map<string, AuthorInfo>;
  onSelectTexte: (t: TexteRow) => void;
}> = ({ marche, texts, authorMap, onSelectTexte }) => {
  const [open, setOpen] = useState(true);
  const label = marche ? (marche.nom_marche || marche.ville) : 'Point inconnu';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-violet-500" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{texts.length} texte{texts.length > 1 ? 's' : ''}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-2 mt-2 pl-2">
          {texts.map(t => (
            <TexteCard
              key={t.id}
              texte={t}
              author={authorMap.get(t.user_id)}
              showAuthor
              onClick={() => onSelectTexte(t)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TextesEcritsSubTab;
