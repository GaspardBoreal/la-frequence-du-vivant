import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Save, MapPin, Loader2, Map, ExternalLink } from 'lucide-react';
import { useSupabaseMarche } from '../../../hooks/useSupabaseMarches';
import { useMarcheTextes } from '../../../hooks/useMarcheTextes';
import { createMarche, updateMarche, MarcheFormData } from '../../../utils/supabaseMarcheOperations';
import { queryClient } from '../../../lib/queryClient';
import { FRENCH_REGIONS } from '../../../utils/frenchRegions';
import { FRENCH_DEPARTMENTS } from '../../../utils/frenchDepartments';
import { toast } from 'sonner';
import { geocodeAddress } from '../../../utils/geocoding';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import PhotoCaptureFloat from './PhotoCaptureFloat';
import AudioCaptureFloat from './AudioCaptureFloat';
import PhotoGalleryMobile from './PhotoGalleryMobile';
import AudioGalleryMobile from './AudioGalleryMobile';
import MarcheTextesAdminMobile from './MarcheTextesAdminMobile';
import TexteCaptureFloat from './TexteCaptureFloat';
import MediaCaptureFloat from './MediaCaptureFloat';
import { ProcessedPhoto } from '../../../utils/photoUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../integrations/supabase/client';

interface MarcheFormMobileProps {
  mode: 'create' | 'edit';
  marcheId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

// Interface simplifiée pour le formulaire mobile
interface FormDataMobile {
  ville: string;
  region: string;
  departement: string;
  nomMarche: string;
  descriptifCourt: string;
  date: string;
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  tags: string;
}

const MarcheFormMobile: React.FC<MarcheFormMobileProps> = ({
  mode,
  marcheId,
  onCancel,
  onSuccess
}) => {
  const {
    data: marche,
    isLoading
  } = useSupabaseMarche(marcheId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<ProcessedPhoto[]>([]);
  const [mapSheetOpen, setMapSheetOpen] = useState(false);

  // Hooks pour récupérer les compteurs
  const { data: textes = [] } = useMarcheTextes(marcheId || '');
  
  const { data: photosCount = 0 } = useQuery({
    queryKey: ['photos-count', marcheId],
    queryFn: async () => {
      if (!marcheId) return 0;
      const { count } = await supabase
        .from('marche_photos')
        .select('*', { count: 'exact', head: true })
        .eq('marche_id', marcheId);
      return count || 0;
    },
    enabled: !!marcheId
  });

  const { data: audiosCount = 0 } = useQuery({
    queryKey: ['audios-count', marcheId],
    queryFn: async () => {
      if (!marcheId) return 0;
      const { count } = await supabase
        .from('marche_audio')
        .select('*', { count: 'exact', head: true })
        .eq('marche_id', marcheId);
      return count || 0;
    },
    enabled: !!marcheId
  });
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormDataMobile>();
  
  const selectedRegion = watch('region');
  const selectedDepartement = watch('departement');
  const currentLatitude = watch('latitude');
  const currentLongitude = watch('longitude');
  
  const hasCoordinates = currentLatitude !== null && currentLongitude !== null && 
                        currentLatitude !== undefined && currentLongitude !== undefined;

  // Fonction pour gérer la capture/import de photos
  const handlePhotoCaptured = (photo: ProcessedPhoto) => {
    setPendingPhotos(prev => [...prev, photo]);
    toast.success('📸 Photo ajoutée ! Elle sera uploadée à la sauvegarde.');
  };

  const handlePhotoUploaded = (photoId: string) => {
    // Retirer la photo des pending une fois uploadée
    setPendingPhotos(prev => prev.filter((_, index) => index > 0));
  };

  const handlePhotoRemoved = (photoId: string) => {
    toast.info('🗑️ Photo supprimée');
  };

  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGeolocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Mise à jour des coordonnées
          setValue('latitude', latitude);
          setValue('longitude', longitude);
          
          // Géocodage inverse pour récupérer l'adresse
          try {
            const result = await geocodeAddress(`${latitude}, ${longitude}`);
            if (result.address) {
              setValue('adresse', result.address);
            }
          } catch (geocodeError) {
            console.warn('Erreur géocodage inverse:', geocodeError);
          }
          
          toast.success('Position récupérée avec succès !');
        } catch (error) {
          console.error('Erreur lors du traitement de la position:', error);
          toast.error('Erreur lors du traitement de la position');
        } finally {
          setIsGeolocating(false);
        }
      },
      (error) => {
        setIsGeolocating(false);
        let errorMessage = 'Erreur de géolocalisation';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la géolocalisation refusé. Activez-la dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible. Vérifiez votre connexion.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé pour la géolocalisation.';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const openGoogleMaps = () => {
    if (!hasCoordinates) return;
    const url = `https://maps.google.com/?q=${currentLatitude},${currentLongitude}`;
    window.open(url, '_blank');
    setMapSheetOpen(false);
    toast.success('📍 Ouverture de Google Maps');
  };

  const openOpenStreetMap = () => {
    if (!hasCoordinates) return;
    const url = `https://www.openstreetmap.org/?mlat=${currentLatitude}&mlon=${currentLongitude}&zoom=16`;
    window.open(url, '_blank');
    setMapSheetOpen(false);
    toast.success('🗺️ Ouverture d\'OpenStreetMap');
  };

  const openStreetView = () => {
    if (!hasCoordinates) return;
    const url = `https://www.google.com/maps/@${currentLatitude},${currentLongitude},3a,75y,0h,90t/data=!3m4!1e1!3m2!1s0x0:0x0!2e0`;
    window.open(url, '_blank');
    setMapSheetOpen(false);
    toast.success('👁️ Ouverture de Street View');
  };
  
  useEffect(() => {
    if (mode === 'edit' && marche) {
      const formData: FormDataMobile = {
        ville: marche.ville || '',
        region: marche.region || '',
        departement: marche.departement || '',
        nomMarche: marche.nomMarche || '',
        descriptifCourt: marche.descriptifCourt || '',
        date: marche.date || '',
        latitude: marche.latitude ?? null,
        longitude: marche.longitude ?? null,
        adresse: marche.adresse || '',
        tags: marche.supabaseTags?.join(', ') || ''
      };
      
      reset(formData);
    }
  }, [mode, marche, reset]);
  
  const onSubmit = async (data: FormDataMobile) => {
    setIsSubmitting(true);
    try {
      const apiData: MarcheFormData = {
        ville: data.ville,
        region: data.region,
        departement: data.departement,
        nomMarche: data.nomMarche,
        descriptifCourt: data.descriptifCourt,
        descriptifLong: '', // Vide pour mobile
        date: data.date,
        temperature: null,
        latitude: data.latitude,
        longitude: data.longitude,
        adresse: data.adresse,
        lienGoogleDrive: '',
        sousThemes: [],
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        themesPrincipaux: []
      };
      
      if (mode === 'create') {
        await createMarche(apiData);
        toast.success('Marche créée avec succès !');
      } else if (mode === 'edit' && marcheId) {
        const result = await updateMarche(marcheId, apiData);
        
        if (result) {
          toast.success('Marche mise à jour !');
          await queryClient.invalidateQueries({
            queryKey: ['marches-supabase']
          });
        } else {
          throw new Error('La mise à jour a échoué');
        }
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (mode === 'edit' && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Informations de base */}
        <div className="space-y-4 bg-card rounded-lg p-4 border border-border">
          <h3 className="font-semibold text-foreground">Informations de base</h3>
          
          <div>
            <Label htmlFor="ville">Ville *</Label>
            <Input 
              id="ville" 
              {...register('ville', { required: 'La ville est requise' })} 
              className={errors.ville ? 'border-red-500' : ''} 
            />
            {errors.ville && (
              <p className="text-red-500 text-sm mt-1">{errors.ville.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nomMarche">Nom de la marche</Label>
            <Input id="nomMarche" {...register('nomMarche')} />
          </div>

          <div>
            <Label htmlFor="region">Région</Label>
            <Select value={selectedRegion || ''} onValueChange={value => setValue('region', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une région" />
              </SelectTrigger>
              <SelectContent>
                {FRENCH_REGIONS.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="departement">Département</Label>
            <Select value={selectedDepartement || ''} onValueChange={value => setValue('departement', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un département" />
              </SelectTrigger>
              <SelectContent>
                {FRENCH_DEPARTMENTS.map(department => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 bg-card rounded-lg p-4 border border-border">
          <h3 className="font-semibold text-foreground">Description</h3>
          
          <div>
            <Label htmlFor="descriptifCourt">Description courte</Label>
            <Textarea 
              id="descriptifCourt" 
              {...register('descriptifCourt')} 
              placeholder="Décrivez brièvement cette marche..."
              rows={3}
            />
          </div>
        </div>

        {/* Localisation */}
        <div className="space-y-4 bg-card rounded-lg p-4 border border-border">
          <h3 className="font-semibold text-foreground">Localisation</h3>
          
          <div>
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" {...register('adresse')} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Coordonnées GPS</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeolocation}
                disabled={isGeolocating}
                className="flex items-center gap-2"
              >
                {isGeolocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {isGeolocating ? 'Localisation...' : 'Ma position'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input 
                  id="latitude" 
                  type="number" 
                  step="any" 
                  placeholder="46.603354"
                  {...register('latitude', {
                    setValueAs: value => value === '' ? null : Number(value)
                  })} 
                />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input 
                  id="longitude" 
                  type="number" 
                  step="any" 
                  placeholder="1.888334"
                  {...register('longitude', {
                    setValueAs: value => value === '' ? null : Number(value)
                  })} 
                />
              </div>
            </div>
            
            {/* Bouton Voir sur la carte */}
            {hasCoordinates && (
              <div className="pt-3 border-t border-border">
                <Sheet open={mapSheetOpen} onOpenChange={setMapSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full animate-fade-in hover-scale"
                    >
                      <Map className="h-4 w-4 mr-2" />
                      🗺️ Voir sur la carte
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[280px]">
                    <SheetHeader>
                      <SheetTitle>📍 Choisir une carte</SheetTitle>
                      <SheetDescription>
                        Position: {currentLatitude?.toFixed(6)}, {currentLongitude?.toFixed(6)}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-6">
                      <Button
                        onClick={openGoogleMaps}
                        variant="outline"
                        className="h-14 text-left justify-start hover-scale"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">🌍</div>
                          <div>
                            <div className="font-semibold">Google Maps</div>
                            <div className="text-sm text-muted-foreground">Navigation et détails</div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                      
                      <Button
                        onClick={openOpenStreetMap}
                        variant="outline"
                        className="h-14 text-left justify-start hover-scale"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">🗺️</div>
                          <div>
                            <div className="font-semibold">OpenStreetMap</div>
                            <div className="text-sm text-muted-foreground">Carte open source</div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                      
                      <Button
                        onClick={openStreetView}
                        variant="outline"
                        className="h-14 text-left justify-start hover-scale"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">👁️</div>
                          <div>
                            <div className="font-semibold">Street View</div>
                            <div className="text-sm text-muted-foreground">Vue à 360°</div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 bg-card rounded-lg p-4 border border-border">
          <h3 className="font-semibold text-foreground">Tags</h3>
          
          <div>
            <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
            <Input 
              id="tags" 
              {...register('tags')} 
              placeholder="nature, urbain, historique"
            />
          </div>
        </div>

        {/* Photos */}
        {marcheId && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm text-muted-foreground px-3">Photos ({photosCount + pendingPhotos.length})</span>
              <div className="h-px bg-border flex-1" />
            </div>
            
            <PhotoGalleryMobile
              marcheId={marcheId}
              pendingPhotos={pendingPhotos}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoRemoved={handlePhotoRemoved}
            />
          </div>
        )}

        {/* Audio */}
        {marcheId && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm text-muted-foreground px-3">Audio ({audiosCount})</span>
              <div className="h-px bg-border flex-1" />
            </div>
            
            <AudioGalleryMobile
              marcheId={marcheId}
              pendingAudios={[]}
              onAudioUploaded={() => {
                toast.success('Audio uploadé avec succès !');
              }}
              onAudioRemoved={() => {
                toast.success('Audio supprimé');
              }}
            />
          </div>
        )}

        {/* Textes littéraires */}
        {marcheId && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-px bg-border flex-1" />
              <span className="text-sm text-muted-foreground px-3">Textes littéraires ({textes.length})</span>
              <div className="h-px bg-border flex-1" />
            </div>
            
            <MarcheTextesAdminMobile marcheId={marcheId} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-3 pt-6">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          
          <Button type="button" variant="outline" onClick={onCancel} className="w-full">
            Annuler
          </Button>
        </div>
      </form>

      {/* Photo Capture Float - Only show when we have a marcheId */}
      {marcheId && (
        <>
          <MediaCaptureFloat
            marcheId={marcheId}
            onPhotoCaptured={handlePhotoCaptured}
            onAudioUploaded={() => {
              toast.success('Audio ajouté avec succès !');
            }}
            pendingPhotosCount={pendingPhotos.length}
            disabled={isSubmitting}
          />
        </>
      )}
    </div>
  );
};

export default MarcheFormMobile;