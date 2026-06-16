import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import {
  AGE_BRACKETS, CSP_OPTIONS, GENDER_OPTIONS, computeAgeBracket,
} from '@/lib/communityProfileTaxonomy';
import ProfilCard from './ProfilCard';
import NetworkFilters, { type NetworkFilterMode, type SpecialFilter } from './NetworkFilters';
import AdhesionFilters, { type AdhesionFilter, type CollegeFilter } from './AdhesionFilters';
import SuggestionsBanner from './SuggestionsBanner';
import type { EditableProfile } from './MarcheurEditSheet';
import { useAllScienceAccounts } from '@/hooks/useScienceAccounts';
import { NETWORK_ORDER, type ScienceAccount, type ScienceNetwork } from '@/types/scienceAccounts';

interface Props {
  profiles: (EditableProfile & { marches_count?: number })[];
  onEdit: (p: EditableProfile) => void;
}

const ROLE_FILTERS = [
  { value: 'all', label: 'Tous les rôles' },
  { value: 'marcheur_en_devenir', label: 'En devenir' },
  { value: 'marcheur', label: 'Marcheur' },
  { value: 'eclaireur', label: 'Éclaireur' },
  { value: 'ambassadeur', label: 'Ambassadeur' },
  { value: 'sentinelle', label: 'Sentinelle' },
];

export const ProfilsMosaique: React.FC<Props> = ({ profiles, onEdit }) => {
  const [search, setSearch] = useState('');
  const [age, setAge] = useState('all');
  const [gender, setGender] = useState('all');
  const [csp, setCsp] = useState('all');
  const [role, setRole] = useState('all');
  const [selectedNetworks, setSelectedNetworks] = useState<ScienceNetwork[]>([]);
  const [networkMode, setNetworkMode] = useState<NetworkFilterMode>('or');
  const [special, setSpecial] = useState<SpecialFilter>('none');

  const { data: allAccounts = [] } = useAllScienceAccounts();

  // Map profile_id → accounts
  const accountsByProfile = useMemo(() => {
    const map = new Map<string, ScienceAccount[]>();
    for (const a of allAccounts) {
      const arr = map.get(a.profile_id) || [];
      arr.push(a);
      map.set(a.profile_id, arr);
    }
    return map;
  }, [allAccounts]);

  // Enrich profiles
  const enriched = useMemo(() => profiles.map(p => ({
    ...p,
    science_accounts: accountsByProfile.get(p.id) || [],
  })), [profiles, accountsByProfile]);

  // Counts per network (across visible profiles before network filter)
  const networkCounts = useMemo(() => {
    const c = Object.fromEntries(NETWORK_ORDER.map(k => [k, 0])) as Record<ScienceNetwork, number>;
    for (const p of enriched) {
      const seen = new Set<ScienceNetwork>();
      for (const a of p.science_accounts) {
        if (!seen.has(a.network)) { c[a.network]++; seen.add(a.network); }
      }
    }
    return c;
  }, [enriched]);

  const totalWithAny = useMemo(
    () => enriched.filter(p => p.science_accounts.length > 0).length,
    [enriched],
  );
  const totalWithoutAny = enriched.length - totalWithAny;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(p => {
      if (q) {
        const hay = `${p.prenom} ${p.nom} ${p.ville || ''} ${p.csp_precision || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (role !== 'all' && p.role !== role) return false;
      if (gender !== 'all' && (p.genre || '') !== gender) return false;
      if (csp !== 'all' && (p.csp || '') !== csp) return false;
      if (age !== 'all') {
        const b = computeAgeBracket(p.date_naissance);
        if (b !== age) return false;
      }

      // Special filters
      if (special === 'any' && p.science_accounts.length === 0) return false;
      if (special === 'empty' && p.science_accounts.length > 0) return false;

      // Network filter
      if (selectedNetworks.length > 0) {
        const owned = new Set(p.science_accounts.map(a => a.network));
        if (networkMode === 'or') {
          if (!selectedNetworks.some(n => owned.has(n))) return false;
        } else {
          if (!selectedNetworks.every(n => owned.has(n))) return false;
        }
      }
      return true;
    });
  }, [enriched, search, age, gender, csp, role, selectedNetworks, networkMode, special]);

  return (
    <div className="space-y-4">
      <SuggestionsBanner />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (nom, ville, métier précis…)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={age} onValueChange={setAge}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes tranches d'âge</SelectItem>
            {AGE_BRACKETS.map(b => <SelectItem key={b.value} value={b.value}>{b.label} · {b.range}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous genres</SelectItem>
            {GENDER_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={csp} onValueChange={setCsp}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes activités</SelectItem>
            {CSP_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.short}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <NetworkFilters
        selected={selectedNetworks}
        onSelectedChange={setSelectedNetworks}
        mode={networkMode}
        onModeChange={setNetworkMode}
        special={special}
        onSpecialChange={setSpecial}
        counts={networkCounts}
        totalWithAny={totalWithAny}
        totalWithoutAny={totalWithoutAny}
      />

      <div className="flex items-center justify-between">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filtered.length} profil{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Aucun profil ne correspond à ces filtres.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => <ProfilCard key={p.id} profile={p} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  );
};

export default ProfilsMosaique;
