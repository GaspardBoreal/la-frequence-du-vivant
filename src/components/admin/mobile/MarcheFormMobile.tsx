import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Save } from 'lucide-react';
import { useSupabaseMarche } from '../../../hooks/useSupabaseMarches';
import { createMarche, updateMarche, MarcheFormData } from '../../../utils/supabaseMarcheOperations';
import { queryClient } from '../../../lib/queryClient';
import { FRENCH_REGIONS } from '../../../utils/frenchRegions';
import { FRENCH_DEPARTMENTS } from '../../../utils/frenchDepartments';
import { toast } from 'sonner';

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
    </div>
  );
};

export default MarcheFormMobile;