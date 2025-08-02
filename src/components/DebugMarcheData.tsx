import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';

interface DebugMarcheDataProps {
  marche: MarcheTechnoSensible;
}

const DebugMarcheData: React.FC<DebugMarcheDataProps> = ({ marche }) => {
  const [isOpen, setIsOpen] = useState(false);

  const testMediaUrl = async (url: string, type: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`${type} ${url}:`, response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error(`Erreur test ${type} ${url}:`, error);
      return false;
    }
  };

  const testAllMedia = async () => {
    console.log('🧪 Test de tous les médias pour:', marche.ville);
    
    if (marche.photos) {
      for (let i = 0; i < marche.photos.length; i++) {
        await testMediaUrl(marche.photos[i], `Photo ${i + 1}`);
      }
    }
    
    if (marche.audioFiles) {
      for (let i = 0; i < marche.audioFiles.length; i++) {
        await testMediaUrl(marche.audioFiles[i], `Audio ${i + 1}`);
      }
    }
    
    if (marche.videos) {
      for (let i = 0; i < marche.videos.length; i++) {
        await testMediaUrl(marche.videos[i], `Video ${i + 1}`);
      }
    }
  };

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <CardTitle className="text-lg text-yellow-800">
                🔍 DEBUG - Données de la marche {marche.ville}
              </CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <CardContent className="p-0 space-y-4">
              {/* Informations générales */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Informations générales</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>ID:</strong> {marche.id}</div>
                  <div><strong>Supabase ID:</strong> {marche.supabaseId || 'N/A'}</div>
                  <div><strong>Nom marche:</strong> {marche.nomMarche || 'N/A'}</div>
                  <div><strong>Ville:</strong> {marche.ville}</div>
                  <div><strong>Département:</strong> {marche.departement || 'N/A'}</div>
                  <div><strong>Région:</strong> {marche.region || 'N/A'}</div>
                  <div><strong>Thème:</strong> {marche.theme || 'N/A'}</div>
                  <div><strong>Date:</strong> {marche.date || 'N/A'}</div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Descriptions</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Descriptif court:</strong> {marche.descriptifCourt || 'N/A'}</div>
                  <div><strong>Descriptif long:</strong> {marche.descriptifLong || 'N/A'}</div>
                  <div><strong>Poème:</strong> {marche.poeme || 'N/A'}</div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="text-sm">
                  <div><strong>Tags legacy:</strong> {marche.tags || 'N/A'}</div>
                  <div><strong>Tags Supabase:</strong> {marche.supabaseTags?.join(', ') || 'N/A'}</div>
                  <div><strong>Tags thématiques:</strong> {marche.tagsThematiques?.join(', ') || 'N/A'}</div>
                  <div><strong>Sous-thèmes:</strong> {marche.sousThemes?.join(', ') || 'N/A'}</div>
                </div>
              </div>

              {/* Médias */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Médias</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Photos ({marche.photos?.length || 0}):</strong></div>
                  {marche.photos?.map((url, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2">
                      <span>• Photo {index + 1}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Voir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                  
                  <div><strong>Audio ({marche.audioFiles?.length || 0}):</strong></div>
                  {marche.audioFiles?.map((url, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2">
                      <span>• Audio {index + 1}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Écouter <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                  
                  <div><strong>Vidéos ({marche.videos?.length || 0}):</strong></div>
                  {marche.videos?.map((url, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2">
                      <span>• Vidéo {index + 1}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Voir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Études et documents */}
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Études et Documents</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Études ({marche.etudes?.length || 0}):</strong></div>
                  {marche.etudes?.map((etude, index) => (
                    <div key={index} className="pl-4">
                      • {etude.titre} ({etude.type})
                    </div>
                  ))}
                  
                  <div><strong>Documents ({marche.documents?.length || 0}):</strong></div>
                  {marche.documents?.map((doc, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2">
                      <span>• {doc.nom}</span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Télécharger <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={testAllMedia} className="w-full">
                🧪 Tester la connectivité de tous les médias
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};

export default DebugMarcheData;