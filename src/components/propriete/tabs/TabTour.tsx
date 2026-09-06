import React from 'react';
import { Footprints } from 'lucide-react';
import TourList from '@/components/propriete/tour/TourList';
import TourDetail from '@/components/propriete/tour/TourDetail';
import { TourRefProvider, useBuildTourRefIndex } from '@/components/propriete/tour/refs/useTourRefIndex';
import TourRefSheet from '@/components/propriete/tour/refs/TourRefSheet';
import {
  useProprieteTours,
  useSuggestTour,
  type ProprieteTour,
} from '@/hooks/propriete/useProprieteTours';

export const TabTour: React.FC<{ proprieteId: string; proprieteNom: string }> = ({
  proprieteId,
  proprieteNom,
}) => {
  const { tours, isLoading, create, update, remove } = useProprieteTours(proprieteId);
  const suggest = useSuggestTour(proprieteId);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const refIndex = useBuildTourRefIndex(proprieteId);

  const current = tours.find((t) => t.id === openId) ?? null;

  const handleCreate = async (input: Parameters<typeof create>[0]) => {
    const t = await create(input);
    if (t) setOpenId((t as ProprieteTour).id);
    return t;
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setOpenId(null);
  };

  return (
    <TourRefProvider value={refIndex}>
    <div className="space-y-5">
      <header className="space-y-1.5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Footprints className="h-5 w-5 text-primary" />
          Tour de Jardin
        </h2>
        <p className="text-sm text-muted-foreground">
          Chaque tour est une sortie d'observation à {proprieteNom} : ce qui va déjà bien, et les gestes
          qui feront grandir la biodiversité et la résilience du lieu.
        </p>
      </header>

      {current ? (
        <TourDetail
          tour={current}
          proprieteNom={proprieteNom}
          onBack={() => setOpenId(null)}
          onUpdateTour={update}
          onDeleteTour={handleDelete}
          onEnrich={() => suggest.mutate({ tourId: current.id })}
          enriching={suggest.isPending}
        />
      ) : (
        <TourList
          tours={tours}
          isLoading={isLoading}
          onOpen={(t) => setOpenId(t.id)}
          onCreate={handleCreate}
          onSuggest={() =>
            suggest.mutate(undefined, { onSuccess: (res) => setOpenId(res.tourId) })
          }
          suggesting={suggest.isPending}
        />
      )}
      <TourRefSheet />
    </div>
    </TourRefProvider>
  );
};

export default TabTour;
