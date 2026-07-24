import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Leaf, MapPin, Star, ArrowRight } from 'lucide-react';
import { ProprieteTile } from './ProprieteTile';
import type { ProprieteAccess } from '@/hooks/useUserAppsAccess';

const DEFAULT_KEY = 'mdv:default-app';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prenom?: string;
  proprietes: ProprieteAccess[];
}

export function AppChoiceDialog({ open, onOpenChange, prenom, proprietes }: Props) {
  const navigate = useNavigate();

  const go = (target: string, remember?: boolean) => {
    if (remember) {
      try { localStorage.setItem(DEFAULT_KEY, target); } catch {}
    }
    onOpenChange(false);
    if (target === 'mon-espace') {
      navigate('/marches-du-vivant/mon-espace');
    } else if (target.startsWith('propriete:')) {
      navigate(`/propriete/${target.slice('propriete:'.length)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Bienvenue {prenom ? `${prenom} ` : ''}🌿
          </DialogTitle>
          <DialogDescription className="text-emerald-100/80">
            Vous avez accès à plusieurs espaces. Où souhaitez-vous aller ?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {/* Mon Espace Marcheur */}
          <button
            onClick={() => go('mon-espace')}
            className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all p-4 text-left flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white">Mon Espace Marcheur</div>
              <div className="text-sm text-emerald-100/70">Vos marches, votre carnet, votre progression</div>
              <button
                onClick={(e) => { e.stopPropagation(); go('mon-espace', true); }}
                className="text-xs text-emerald-300/70 hover:text-emerald-200 mt-1 underline-offset-2 hover:underline"
              >
                Toujours ouvrir cet espace
              </button>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Propriétés */}
          {proprietes.map((p) => {
            const target = `propriete:${p.slug}`;
            return (
              <button
                key={p.id}
                onClick={() => go(target)}
                className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all p-4 text-left flex items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-xl shrink-0 bg-cover bg-center border border-white/10"
                  style={{
                    backgroundImage: p.photo_hero_url
                      ? `url(${p.photo_hero_url})`
                      : 'linear-gradient(135deg,#0D6B58,#14b8a6)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{p.nom}</span>
                    {p.is_main && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> Principal
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
                      {p.role}
                    </span>
                  </div>
                  {p.ville && (
                    <div className="text-sm text-emerald-100/70 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" /> {p.ville}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); go(target, true); }}
                    className="text-xs text-emerald-300/70 hover:text-emerald-200 mt-1 underline-offset-2 hover:underline"
                  >
                    Toujours ouvrir cet espace
                  </button>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        <p className="text-xs text-emerald-200/50 mt-2 text-center">
          Vous pourrez changer d'espace à tout moment depuis le sélecteur en haut de page.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function getDefaultAppTarget(): string | null {
  try { return localStorage.getItem(DEFAULT_KEY); } catch { return null; }
}

export function clearDefaultAppTarget() {
  try { localStorage.removeItem(DEFAULT_KEY); } catch {}
}
