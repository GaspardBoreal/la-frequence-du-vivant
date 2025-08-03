import React, { useState, useMemo } from 'react';
import { Search, MapPin, Calendar, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';

interface ModernMarcheSelectorProps {
  marches: MarcheTechnoSensible[];
  selectedMarche: string;
  onSelectMarche: (marcheId: string) => void;
  isLoading?: boolean;
}

export const ModernMarcheSelector: React.FC<ModernMarcheSelectorProps> = ({
  marches,
  selectedMarche,
  onSelectMarche,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDepartments, setOpenDepartments] = useState<Set<string>>(new Set());

  // Organisation des marches par département et ville avec filtrage
  const organizedMarches = useMemo(() => {
    const organized: Record<string, Record<string, MarcheTechnoSensible[]>> = {};
    
    marches
      .filter(marche => 
        marche.nomMarche?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marche.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marche.departement.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .forEach(marche => {
        if (!organized[marche.departement]) {
          organized[marche.departement] = {};
        }
        if (!organized[marche.departement][marche.ville]) {
          organized[marche.departement][marche.ville] = [];
        }
        organized[marche.departement][marche.ville].push(marche);
      });
    
    return organized;
  }, [marches, searchTerm]);

  // Statistiques par département
  const departmentStats = useMemo(() => {
    const stats: Record<string, { marchesCount: number; citiesCount: number }> = {};
    
    Object.keys(organizedMarches).forEach(dept => {
      const cities = Object.keys(organizedMarches[dept]);
      const totalMarches = cities.reduce((acc, city) => acc + organizedMarches[dept][city].length, 0);
      
      stats[dept] = {
        marchesCount: totalMarches,
        citiesCount: cities.length
      };
    });
    
    return stats;
  }, [organizedMarches]);

  const toggleDepartment = (department: string) => {
    const newOpenDepartments = new Set(openDepartments);
    if (newOpenDepartments.has(department)) {
      newOpenDepartments.delete(department);
    } else {
      newOpenDepartments.add(department);
    }
    setOpenDepartments(newOpenDepartments);
  };

  const selectedMarcheData = marches.find(m => m.supabaseId === selectedMarche);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher une marche, ville ou département..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base border-2 focus:border-primary"
        />
      </div>

      {/* Marche sélectionnée */}
      {selectedMarcheData && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedMarcheData.nomMarche || `Marche ${selectedMarcheData.ville}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedMarcheData.ville}, {selectedMarcheData.departement}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-primary">Sélectionnée</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des marches par département */}
      <Card className="max-h-96 overflow-y-auto">
        <CardContent className="p-0">
          {Object.keys(organizedMarches).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune marche trouvée pour cette recherche</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.keys(organizedMarches)
                .sort()
                .map(department => (
                  <Collapsible
                    key={department}
                    open={openDepartments.has(department)}
                    onOpenChange={() => toggleDepartment(department)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto hover:bg-gray-50 rounded-none"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{department}</h3>
                            <p className="text-sm text-gray-600">
                              {departmentStats[department].marchesCount} marche{departmentStats[department].marchesCount > 1 ? 's' : ''} • {departmentStats[department].citiesCount} ville{departmentStats[department].citiesCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {openDepartments.has(department) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="bg-gray-50">
                      <div className="space-y-1 p-2">
                        {Object.keys(organizedMarches[department])
                          .sort()
                          .map(city => (
                            <div key={city} className="space-y-1">
                              {/* Nom de la ville */}
                              <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-200 rounded-md">
                                {city} ({organizedMarches[department][city].length})
                              </div>
                              
                              {/* Marches de cette ville */}
                              {organizedMarches[department][city]
                                .sort((a, b) => (a.nomMarche || '').localeCompare(b.nomMarche || ''))
                                .map(marche => (
                                  <Button
                                    key={marche.supabaseId}
                                    variant={selectedMarche === marche.supabaseId ? "default" : "ghost"}
                                    className={`w-full justify-start p-3 h-auto text-left rounded-lg ${
                                      selectedMarche === marche.supabaseId 
                                        ? "bg-primary text-primary-foreground" 
                                        : "hover:bg-white hover:shadow-sm"
                                    }`}
                                    onClick={() => onSelectMarche(marche.supabaseId || '')}
                                  >
                                    <div className="flex items-center space-x-3 w-full">
                                      <div className={`p-1.5 rounded-md ${
                                        selectedMarche === marche.supabaseId 
                                          ? "bg-primary-foreground/20" 
                                          : "bg-green-100"
                                      }`}>
                                        <Users className={`h-3 w-3 ${
                                          selectedMarche === marche.supabaseId 
                                            ? "text-primary-foreground" 
                                            : "text-green-600"
                                        }`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-sm truncate ${
                                          selectedMarche === marche.supabaseId 
                                            ? "text-primary-foreground" 
                                            : "text-gray-900"
                                        }`}>
                                          {marche.nomMarche || `Marche ${marche.ville}`}
                                        </p>
                                        {marche.date && (
                                          <div className={`flex items-center space-x-1 text-xs ${
                                            selectedMarche === marche.supabaseId 
                                              ? "text-primary-foreground/80" 
                                              : "text-gray-500"
                                          }`}>
                                            <Calendar className="h-3 w-3" />
                                            <span>{marche.date}</span>
                                          </div>
                                        )}
                                      </div>
                                      {selectedMarche === marche.supabaseId && (
                                        <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground text-xs">
                                          ✓
                                        </Badge>
                                      )}
                                    </div>
                                  </Button>
                                ))}
                            </div>
                          ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};