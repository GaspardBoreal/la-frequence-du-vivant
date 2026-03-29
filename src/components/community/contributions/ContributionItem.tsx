import React, { useState } from 'react';
import { Globe, Lock, Trash2, Pencil, Check, X, Music, Camera, Video, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ContributionItemProps {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'texte';
  titre: string | null;
  description?: string | null;
  url?: string | null;
  externalUrl?: string | null;
  contenu?: string;
  typeTexte?: string;
  isPublic: boolean;
  isOwner: boolean;
  createdAt: string;
  viewMode?: 'immersion' | 'fiche';
  onUpdate?: (id: string, updates: Record<string, any>) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

const typeIcons = {
  photo: Camera,
  video: Video,
  audio: Music,
  texte: FileText,
};

const typeColors = {
  photo: 'text-emerald-400',
  video: 'text-blue-400',
  audio: 'text-violet-400',
  texte: 'text-amber-400',
};

const ContributionItem: React.FC<ContributionItemProps> = ({
  id, type, titre, description, url, externalUrl, contenu, typeTexte,
  isPublic, isOwner, createdAt, viewMode = 'fiche', onUpdate, onDelete, onClick,
}) => {
  const [editing, setEditing] = useState(false);
  const [editTitre, setEditTitre] = useState(titre || '');
  const [editDesc, setEditDesc] = useState(description || contenu || '');

  const Icon = typeIcons[type];
  const displayUrl = url || externalUrl;

  const handleSave = () => {
    if (!onUpdate) return;
    if (type === 'texte') {
      onUpdate(id, { titre: editTitre, contenu: editDesc });
    } else {
      onUpdate(id, { titre: editTitre, description: editDesc });
    }
    setEditing(false);
  };

  // ─── Immersion mode: photo/video only, minimal chrome ───
  if (viewMode === 'immersion' && (type === 'photo' || type === 'video')) {
    return (
      <div
        className="relative overflow-hidden rounded-xl cursor-pointer group"
        onClick={onClick}
      >
        <div className="aspect-[3/4] relative bg-black/20">
          {type === 'photo' && displayUrl && (
            <img src={displayUrl} alt={titre || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          )}
          {type === 'video' && displayUrl && (
            <div className="w-full h-full flex items-center justify-center bg-black/30">
              <Video className="w-8 h-8 text-white/40" />
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="text-white text-[10px] font-medium truncate block">{titre || 'Sans titre'}</span>
          </div>
          {/* Visibility indicator */}
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPublic ? <Globe className="w-2.5 h-2.5 text-blue-300/80" /> : <Lock className="w-2.5 h-2.5 text-white/40" />}
          </div>
        </div>
      </div>
    );
  }

  // ─── Fiche mode (default): full info ───
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden group">
      {/* Preview zone */}
      {type === 'photo' && displayUrl && (
        <div className="aspect-video w-full overflow-hidden bg-black/20 cursor-pointer" onClick={onClick}>
          <img src={displayUrl} alt={titre || ''} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      {type === 'video' && externalUrl && (
        <div className="aspect-video w-full bg-black/30 flex items-center justify-center">
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs underline">
            ▶ Voir la vidéo
          </a>
        </div>
      )}
      {type === 'video' && url && !externalUrl && (
        <video controls preload="none" className="w-full aspect-video bg-black/30">
          <source src={url} />
        </video>
      )}
      {type === 'audio' && displayUrl && (
        <div className="p-3 pb-0">
          <audio controls preload="none" className="w-full h-8">
            <source src={displayUrl} />
          </audio>
        </div>
      )}

      {/* Info */}
      <div className="p-3 space-y-1.5">
        {editing ? (
          <div className="space-y-2">
            <input
              value={editTitre}
              onChange={e => setEditTitre(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
              placeholder="Titre"
            />
            {type === 'texte' && (
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs min-h-[60px]"
                placeholder="Contenu"
              />
            )}
            <div className="flex gap-1">
              <button onClick={handleSave} className="p-1 rounded bg-emerald-500/20 text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditing(false)} className="p-1 rounded bg-white/10 text-white/50"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", typeColors[type])} />
              <span className="text-white text-xs font-medium truncate flex-1">
                {titre || 'Sans titre'}
              </span>
              {typeTexte && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 capitalize">
                  {typeTexte}
                </span>
              )}
            </div>

            {type === 'texte' && contenu && (
              <p className="text-emerald-100/50 text-[11px] line-clamp-3 whitespace-pre-line">{contenu}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-200/30 text-[10px]">
                  {format(new Date(createdAt), 'dd MMM yyyy', { locale: fr })}
                </span>
                <span className={cn("flex items-center gap-0.5 text-[10px]", isPublic ? "text-blue-400/60" : "text-white/30")}>
                  {isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                </span>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onUpdate?.(id, { is_public: !isPublic })}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    title={isPublic ? 'Rendre privé' : 'Rendre public'}
                  >
                    {isPublic ? <Lock className="w-3 h-3 text-white/40" /> : <Globe className="w-3 h-3 text-blue-400" />}
                  </button>
                  <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-white/10 transition-colors">
                    <Pencil className="w-3 h-3 text-white/40" />
                  </button>
                  <button onClick={() => onDelete?.(id)} className="p-1 rounded hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3 h-3 text-red-400/60" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContributionItem;
