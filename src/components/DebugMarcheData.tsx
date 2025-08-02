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
            <Button variant="ghost" className="w-full justify-between p-0 h-auto text-black hover:bg-yellow-100">
              <CardTitle className="text-lg text-yellow-800">
                🔍 DEBUG - Données de la marche {marche.ville}
              </CardTitle>
              {isOpen ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronRight className="h-4 w-4 text-black" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <CardContent className="p-0 space-y-4 text-black">
              {/* Informations générales */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-black">Informations générales</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-black">
                  <div><strong className="text-black">ID:</strong> <span className="text-gray-800">{marche.id}</span></div>
                  <div><strong className="text-black">Supabase ID:</strong> <span className="text-gray-800">{marche.supabaseId || "N/A"}</span></div>
                  <div><strong className="text-black">Nom marche:</strong> <span className="text-gray-800">{marche.nomMarche || "N/A"}</span></div>
                  <div><strong className="text-black">Ville:</strong> <span className="text-gray-800">{marche.ville}</span></div>
                  <div><strong className="text-black">Département:</strong> <span className="text-gray-800">{marche.departement || "N/A"}</span></div>
                  <div><strong className="text-black">Région:</strong> <span className="text-gray-800">{marche.region || "N/A"}</span></div>
                  <div><strong className="text-black">Thème:</strong> <span className="text-gray-800">{marche.theme || "N/A"}</span></div>
                  <div><strong className="text-black">Date:</strong> <span className="text-gray-800">{marche.date || "N/A"}</span></div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-black">Descriptions</h4>
                <div className="space-y-2 text-sm text-black">
                  <div><strong className="text-black">Descriptif court:</strong> <span className="text-gray-800">{marche.descriptifCourt || "N/A"}</span></div>
                  <div><strong className="text-black">Descriptif long:</strong> <span className="text-gray-800">{marche.descriptifLong || "N/A"}</span></div>
                  <div><strong className="text-black">Poème:</strong> <span className="text-gray-800">{marche.poeme || "N/A"}</span></div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-black">Tags</h4>
                <div className="text-sm text-black">
                  <div><strong className="text-black">Tags legacy:</strong> <span className="text-gray-800">{marche.tags || "N/A"}</span></div>
                  <div><strong className="text-black">Tags Supabase:</strong> <span className="text-gray-800">{marche.supabaseTags?.join(", ") || "N/A"}</span></div>
                  <div><strong className="text-black">Tags thématiques:</strong> <span className="text-gray-800">{marche.tagsThematiques?.join(", ") || "N/A"}</span></div>
                  <div><strong className="text-black">Sous-thèmes:</strong> <span className="text-gray-800">{marche.sousThemes?.join(", ") || "N/A"}</span></div>
                </div>
              </div>

              {/* Médias */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-black">Médias</h4>
                <div className="space-y-2 text-sm text-black">
                  <div><strong className="text-black">Photos ({marche.photos?.length || 0}):</strong></div>
                  {marche.photos?.map((url, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2 text-black">
                      <span className="text-gray-800">• Photo {index + 1}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Voir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                  
                  <div className="text-black"><strong className="text-black">Audio ({marche.audioFiles?.length || 0}):</strong></div>
                  {marche.audioFiles?.map((url, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2 text-black">
                      <span className="text-gray-800">• Audio {index + 1}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Écouter <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                  
                  <div className="text-black"><strong className="text-black">Vidéos ({marche.videos?.length || 0}):</strong></div>
                  {marche.videos?.map((url, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2 text-black">
                      <span className="text-gray-800">• Vidéo {index + 1}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Voir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Études et documents */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-black">Études et Documents</h4>
                <div className="space-y-2 text-sm text-black">
                  <div><strong className="text-black">Études ({marche.etudes?.length || 0}):</strong></div>
                  {marche.etudes?.map((etude, index) => (
                    <div key={index} className="pl-4 text-gray-800">
                      • {etude.titre} ({etude.type})
                    </div>
                  ))}
                  
                  <div className="text-black"><strong className="text-black">Documents ({marche.documents?.length || 0}):</strong></div>
                  {marche.documents?.map((doc, index) => (
                    <div key={index} className="pl-4 flex items-center gap-2 text-black">
                      <span className="text-gray-800">• {doc.nom}</span>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Télécharger <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={testAllMedia} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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