import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminVeilleInat from './AdminVeilleInat';
import VeilleBziiit from '@/components/admin/veille/VeilleBziiit';

export default function AdminVeille() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'inat' ? 'inat' : 'bziiit';
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link to="/admin/outils" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Outils admin
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Veille</h1>
        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="bziiit" className="flex-1">Veille bziiit</TabsTrigger>
            <TabsTrigger value="inat" className="flex-1">Veille iNaturalist</TabsTrigger>
          </TabsList>
          <TabsContent value="bziiit"><VeilleBziiit /></TabsContent>
          <TabsContent value="inat"><AdminVeilleInat embedded /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
