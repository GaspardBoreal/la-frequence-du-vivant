import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Leaf, Sparkles, GraduationCap, HeartPulse, Theater, Building2, Award, Shield } from 'lucide-react';

const KNOWN: Array<{ key: string; label: string; icon: React.ComponentType<any>; color: string }> = [
  { key: 'est_ess', label: 'ESS', icon: Shield, color: 'text-purple-600 border-purple-500/40' },
  { key: 'est_rge', label: 'RGE', icon: Award, color: 'text-emerald-600 border-emerald-500/40' },
  { key: 'est_bio', label: 'Bio', icon: Leaf, color: 'text-green-600 border-green-500/40' },
  { key: 'est_qualiopi', label: 'Qualiopi', icon: Sparkles, color: 'text-blue-600 border-blue-500/40' },
  { key: 'est_finess', label: 'FINESS', icon: HeartPulse, color: 'text-rose-600 border-rose-500/40' },
  { key: 'est_uai', label: 'UAI', icon: GraduationCap, color: 'text-indigo-600 border-indigo-500/40' },
  { key: 'est_entrepreneur_spectacle', label: 'Spectacle', icon: Theater, color: 'text-amber-600 border-amber-500/40' },
  { key: 'est_collectivite_territoriale', label: 'Collectivité', icon: Building2, color: 'text-slate-600 border-slate-500/40' },
  { key: 'est_societe_mission', label: 'Mission', icon: Sparkles, color: 'text-pink-600 border-pink-500/40' },
];

export const CompanyLabelsChips: React.FC<{ complements: Record<string, any> | null | undefined; className?: string }> = ({ complements, className }) => {
  if (!complements) return null;
  const active = KNOWN.filter(k => Boolean(complements[k.key]));
  if (active.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
      {active.map(({ key, label, icon: Icon, color }) => (
        <Badge key={key} variant="outline" className={`gap-1 ${color}`}>
          <Icon className="h-3 w-3" />
          {label}
        </Badge>
      ))}
    </div>
  );
};
