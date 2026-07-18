import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Item {
  id: string;
  preview_url: string | null;
  theme: string;
  category: string;
  ambiance: string;
  download_count: number;
  event_name_snapshot: string | null;
  event_commune_snapshot: string | null;
  created_at: string;
}

const CommunityGallery: React.FC<{ onOpen: (item: Item) => void }> = ({ onOpen }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('wallpaper_generations')
        .select('id,preview_url,theme,category,ambiance,download_count,event_name_snapshot,event_commune_snapshot,created_at')
        .eq('is_public', true)
        .not('preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div>
        <h3 className="font-crimson text-2xl text-center mb-6">Fonds créés par la communauté</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0,1,2,3,4,5,6,7].map(i => <div key={i} className="aspect-video rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center">
        <h3 className="font-crimson text-2xl mb-3">Sois le premier à composer un fond</h3>
        <p className="text-muted-foreground text-sm">La galerie communautaire s'ouvrira dès la première création publique.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-6">
        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-crimson text-2xl">Fonds créés par la communauté</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onOpen(item)}
            className="group relative aspect-video rounded-xl overflow-hidden border border-border/30 bg-black/20 hover:scale-[1.02] transition-transform"
          >
            {item.preview_url && (
              <img src={item.preview_url} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
              <div className="text-xs text-white truncate">
                {item.event_name_snapshot || (item.theme === 'frequence' ? 'La Fréquence' : 'Les Marches')}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/80">
                <Download className="w-3 h-3" /> {item.download_count}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CommunityGallery;
