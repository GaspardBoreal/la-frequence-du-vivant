// ============================================================================
// EXTERNAL LINKS REGISTRY
// ============================================================================

import { 
  Bot, 
  FileText, 
  Instagram, 
  Youtube, 
  Music, 
  BookOpen, 
  Link, 
  Twitter, 
  Facebook,
  Headphones,
  Globe
} from 'lucide-react';
import type { ExternalLinkType } from './types';

export const EXTERNAL_LINKS_REGISTRY: ExternalLinkType[] = [
  {
    id: 'dordonia-agent',
    label: 'Agent Dordonia',
    icon: Bot,
    platform: 'agent',
    contexts: ['texte', 'marche', 'global'],
    color: '#8b5cf6',
  },
  {
    id: 'blog-post',
    label: 'Article de Blog',
    icon: FileText,
    platform: 'blog',
    contexts: ['texte', 'marche', 'partie'],
    color: '#059669',
  },
  {
    id: 'instagram-post',
    label: 'Instagram',
    icon: Instagram,
    platform: 'social',
    urlPattern: 'https://instagram.com/p/{id}',
    contexts: ['texte', 'marche'],
    color: '#e11d48',
  },
  {
    id: 'youtube-video',
    label: 'Vidéo YouTube',
    icon: Youtube,
    platform: 'video',
    urlPattern: 'https://youtube.com/watch?v={id}',
    contexts: ['texte', 'marche', 'partie'],
    color: '#dc2626',
  },
  {
    id: 'soundcloud-track',
    label: 'SoundCloud',
    icon: Music,
    platform: 'audio',
    urlPattern: 'https://soundcloud.com/{user}/{track}',
    contexts: ['texte', 'marche'],
    color: '#f97316',
  },
  {
    id: 'podcast-episode',
    label: 'Épisode Podcast',
    icon: Headphones,
    platform: 'audio',
    contexts: ['marche', 'partie', 'global'],
    color: '#7c3aed',
  },
  {
    id: 'wikipedia-article',
    label: 'Wikipédia',
    icon: BookOpen,
    platform: 'blog',
    urlPattern: 'https://fr.wikipedia.org/wiki/{article}',
    contexts: ['texte', 'marche'],
    color: '#6b7280',
  },
  {
    id: 'twitter-post',
    label: 'Twitter/X',
    icon: Twitter,
    platform: 'social',
    contexts: ['texte', 'marche'],
    color: '#1d9bf0',
  },
  {
    id: 'facebook-post',
    label: 'Facebook',
    icon: Facebook,
    platform: 'social',
    contexts: ['texte', 'marche'],
    color: '#1877f2',
  },
  {
    id: 'external-website',
    label: 'Site Externe',
    icon: Globe,
    platform: 'custom',
    contexts: ['texte', 'marche', 'partie', 'global'],
    color: '#0891b2',
  },
  {
    id: 'custom-link',
    label: 'Lien Personnalisé',
    icon: Link,
    platform: 'custom',
    contexts: ['texte', 'marche', 'partie', 'global'],
    color: '#64748b',
  },
];

export const getExternalLinkType = (id: string): ExternalLinkType | undefined => {
  return EXTERNAL_LINKS_REGISTRY.find(l => l.id === id);
};

export const getExternalLinksByPlatform = (platform: ExternalLinkType['platform']): ExternalLinkType[] => {
  return EXTERNAL_LINKS_REGISTRY.filter(l => l.platform === platform);
};

export const getExternalLinksByContext = (context: ExternalLinkType['contexts'][number]): ExternalLinkType[] => {
  return EXTERNAL_LINKS_REGISTRY.filter(l => l.contexts.includes(context));
};
