import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RichTextEditor } from '../ui/rich-text-editor';
import { Save, ArrowLeft, FileText, Sparkles, Edit3, PenTool } from 'lucide-react';
import { useSupabaseMarche } from '../../hooks/useSupabaseMarches';
import { createMarche, updateMarche, MarcheFormData } from '../../utils/supabaseMarcheOperations';
import MediaUploadSection from './MediaUploadSection';
import AudioUploadSection from './AudioUploadSection';
import MarcheTextesAdmin from './MarcheTextesAdmin';
import { queryClient } from '../../lib/queryClient';
import { FRENCH_REGIONS } from '../../utils/frenchRegions';
import { FRENCH_DEPARTMENTS } from '../../utils/frenchDepartments';
import { toast } from 'sonner';

interface MarcheFormProps {
  mode: 'create' | 'edit';
  marcheId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

// Interface pour le formulaire alignée avec les champs de la base de données
interface FormData {
  ville: string;
  region: string;
  departement: string;
  nomMarche: string;
  descriptifCourt: string;
  descriptifLong: string;
  date: string;
  temperature: number | null;
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  lienGoogleDrive: string;
  sousThemes: string;
  tags: string;
}

const MarcheForm: React.FC<MarcheFormProps> = ({
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
  const [activeTab, setActiveTab] = useState('general');
  const [themePrincipalRichText, setThemePrincipalRichText] = useState('');
  const [descriptifCourtRichText, setDescriptifCourtRichText] = useState('');
  const [descriptifLongRichText, setDescriptifLongRichText] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm<FormData>();
  
  const selectedRegion = watch('region');
  const selectedDepartement = watch('departement');
  
  useEffect(() => {
    if (mode === 'edit' && marche) {
      console.log('📋 Données de la marche à éditer:', marche);
      const formData: FormData = {
        ville: marche.ville || '',
        region: marche.region || '',
        departement: marche.departement || '',
        nomMarche: marche.nomMarche || '',
        descriptifCourt: marche.descriptifCourt || '',
        descriptifLong: marche.descriptifLong || '',
        date: marche.date || '',
        temperature: marche.temperature ?? null,
        latitude: marche.latitude ?? null,
        longitude: marche.longitude ?? null,
        adresse: marche.adresse || '',
        lienGoogleDrive: marche.lien || '',
        sousThemes: marche.sousThemes?.join(', ') || '',
        tags: marche.supabaseTags?.join(', ') || ''
      };
      
      reset(formData);
      setThemePrincipalRichText(marche.theme || '');
      setDescriptifCourtRichText(marche.descriptifCourt || '');
      setDescriptifLongRichText(marche.descriptifLong || '');
    }
  }, [mode, marche, reset]);
  
  const onSubmit = async (data: FormData) => {
    console.log('🔄 Début de la sauvegarde avec les données:', data);
    setIsSubmitting(true);
    try {
      // Utiliser les valeurs des éditeurs riches au lieu des champs du formulaire
      const apiData: MarcheFormData = {
        ville: data.ville,
        region: data.region,
        departement: data.departement,
        nomMarche: data.nomMarche,
        descriptifCourt: descriptifCourtRichText,
        descriptifLong: descriptifLongRichText,
        date: data.date,
        temperature: data.temperature,
        latitude: data.latitude,
        longitude: data.longitude,
        adresse: data.adresse,
        lienGoogleDrive: data.lienGoogleDrive,
        sousThemes: data.sousThemes ? data.sousThemes.split(',').map(t => t.trim()) : [],
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        themesPrincipaux: [themePrincipalRichText].filter(Boolean)
      };
      
      console.log('📦 Données API préparées:', apiData);
      
      if (mode === 'create') {
        console.log('➕ Mode création');
        const newMarcheId = await createMarche(apiData);
        console.log('✅ Nouvelle marche créée avec l\'ID:', newMarcheId);
        toast.success('Marche créée avec succès !');
      } else if (mode === 'edit' && marcheId) {
        console.log('✏️ Mode édition pour ID:', marcheId);
        const result = await updateMarche(marcheId, apiData);
        console.log('🔄 Résultat de la mise à jour:', result);
        
        if (result) {
          console.log('✅ Marche mise à jour avec succès');
          toast.success('Marche mise à jour avec succès !');

          await queryClient.invalidateQueries({
            queryKey: ['marches-supabase']
          });
          await queryClient.refetchQueries({
            queryKey: ['marches-supabase']
          });
        } else {
          throw new Error('La mise à jour a échoué');
        }
      }
      onSuccess();
    } catch (error) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
      toast.error(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (mode === 'edit' && isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>;
  }
  
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {mode === 'create' ? 'Créer une nouvelle marche' : 'Modifier la marche'}
        </h2>
        <Button variant="outline" onClick={onCancel} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Informations</TabsTrigger>
            <TabsTrigger value="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="texts" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Textes littéraires
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ville">Ville *</Label>
                <Input id="ville" {...register('ville', {
                required: 'La ville est requise'
              })} className={errors.ville ? 'border-red-500' : ''} />
                {errors.ville && <p className="text-red-500 text-sm mt-1">{errors.ville.message}</p>}
              </div>

              <div>
                <Label htmlFor="region">Région</Label>
                <Select value={selectedRegion || ''} onValueChange={value => setValue('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRENCH_REGIONS.map(region => <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>)}
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
                    {FRENCH_DEPARTMENTS.map(department => <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nomMarche">Nom de la marche</Label>
                <Input id="nomMarche" {...register('nomMarche')} />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register('date')} />
              </div>

              <div>
                <Label htmlFor="temperature">Température (°C)</Label>
                <Input id="temperature" type="number" step="0.1" {...register('temperature', {
                setValueAs: value => value === '' ? null : Number(value)
              })} />
              </div>

              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" {...register('latitude', {
                setValueAs: value => value === '' ? null : Number(value)
              })} />
              </div>

              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" {...register('longitude', {
                setValueAs: value => value === '' ? null : Number(value)
              })} />
              </div>
            </div>

            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" {...register('adresse')} />
            </div>

            <div>
              <Label htmlFor="lienGoogleDrive">Lien Google Drive</Label>
              <Input id="lienGoogleDrive" type="url" {...register('lienGoogleDrive')} />
            </div>

            <div>
              <Label htmlFor="sousThemes">Sous-thèmes (séparés par des virgules)</Label>
              <Input id="sousThemes" {...register('sousThemes')} placeholder="thème1, thème2, thème3" />
            </div>

            <div>
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input id="tags" {...register('tags')} placeholder="tag1, tag2, tag3" />
            </div>
          </TabsContent>

          <TabsContent value="description" className="space-y-8">
            <div className="gaspard-glass rounded-xl p-8 space-y-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-accent to-accent-foreground bg-clip-text text-transparent">
                    Descriptions Immersives
                  </h3>
                  <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Créez des descriptions captivantes qui transporteront vos lecteurs dans l'univers de votre marche.
                  Utilisez la mise en forme enrichie pour donner vie à vos récits.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Edit3 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold text-foreground">
                        Résumé Captivant
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Un aperçu concis mais évocateur qui donne envie d'en savoir plus
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border border-border/50 shadow-sm">
                    <RichTextEditor
                      value={descriptifCourtRichText}
                      onChange={setDescriptifCourtRichText}
                      placeholder="Décrivez brièvement l'essence de cette marche... Quelle émotion voulez-vous transmettre ?"
                      className="min-h-[200px] bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <PenTool className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold text-foreground">
                        Récit Détaillé
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        L'histoire complète, riche en détails sensoriels et émotionnels
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border border-border/50 shadow-sm">
                    <RichTextEditor
                      value={descriptifLongRichText}
                      onChange={setDescriptifLongRichText}
                      placeholder="Racontez l'histoire complète de cette marche... Plongez dans les détails, les sensations, les rencontres..."
                      className="min-h-[300px] bg-background/50"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-accent/10 rounded-xl border border-accent/20">
                <h4 className="font-semibold text-accent mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Conseils de rédaction
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Utilisez des mots évocateurs qui engagent les sens</li>
                  <li>• Décrivez les atmosphères, les lumières, les sons</li>
                  <li>• Partagez les émotions et les réflexions du moment</li>
                  <li>• Mentionnez les rencontres et les découvertes marquantes</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <MediaUploadSection marcheId={marcheId} mediaType="photos" />
          </TabsContent>

          <TabsContent value="audio">
            <AudioUploadSection marcheId={marcheId} />
          </TabsContent>

          <TabsContent value="texts">
            {marcheId && (
              <MarcheTextesAdmin 
                marcheId={marcheId}
                marcheName={marche?.nomMarche || ''}
              />
            )}
            {!marcheId && (
              <div className="text-center py-8 text-muted-foreground">
                <PenTool className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Veuillez d'abord sauvegarder la marche pour pouvoir ajouter des textes littéraires.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>;
};

export default MarcheForm;
