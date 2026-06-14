import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { List, Sparkles, Leaf, CalendarRange, Image as ImageIcon } from 'lucide-react';
import { CrmMarchesHeaderKpi } from '@/components/crm/marches/CrmMarchesHeaderKpi';
import { MarchesListTab } from '@/components/crm/marches/tabs/MarchesListTab';
import { PratiquesRemarquablesTab } from '@/components/crm/marches/tabs/PratiquesRemarquablesTab';
import { TopEspecesTab } from '@/components/crm/marches/tabs/TopEspecesTab';
import { MaronnierTab } from '@/components/crm/marches/tabs/MaronnierTab';
import { GalerieScenographiesTab } from '@/components/crm/marches/tabs/GalerieScenographiesTab';

const TABS = ['liste', 'pratiques', 'especes', 'maronnier', 'galerie'] as const;
type TabKey = (typeof TABS)[number];

const CrmMarches: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'liste';

  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    if (t === 'liste') next.delete('tab');
    else next.set('tab', t);
    setParams(next, { replace: true });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[hsl(var(--crm-text))] tracking-tight">Marches</h1>
        <p className="text-sm crm-muted mt-1">
          Hub de valorisation des marches du Vivant — patrimoine vivant au service du commerce.
        </p>
      </div>

      <CrmMarchesHeaderKpi />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="liste" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
            <List className="h-4 w-4" /><span>Liste</span>
          </TabsTrigger>
          <TabsTrigger value="pratiques" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
            <Sparkles className="h-4 w-4" /><span>Pratiques</span>
          </TabsTrigger>
          <TabsTrigger value="especes" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
            <Leaf className="h-4 w-4" /><span>Espèces</span>
          </TabsTrigger>
          <TabsTrigger value="maronnier" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
            <CalendarRange className="h-4 w-4" /><span>Maronnier</span>
          </TabsTrigger>
          <TabsTrigger value="galerie" className="flex-col sm:flex-row gap-1 py-2 text-xs sm:text-sm">
            <ImageIcon className="h-4 w-4" /><span>Galerie</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="mt-6"><MarchesListTab /></TabsContent>
        <TabsContent value="pratiques" className="mt-6"><PratiquesRemarquablesTab /></TabsContent>
        <TabsContent value="especes" className="mt-6"><TopEspecesTab /></TabsContent>
        <TabsContent value="maronnier" className="mt-6"><MaronnierTab /></TabsContent>
        <TabsContent value="galerie" className="mt-6"><GalerieScenographiesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmMarches;
