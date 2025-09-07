import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, Filter, Calendar, Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeYearFromSource, collectAvailableYears, generateShortName, type SourceWithYear } from '@/utils/sourceDateUtils';

interface TechnologySourcesCardProps {
  referencedSourceIds: string[];
  importSources: any[];
  className?: string;
}

export const TechnologySourcesCard: React.FC<TechnologySourcesCardProps> = ({
  referencedSourceIds,
  importSources,
  className = ""
}) => {
  const [selectedYear, setSelectedYear] = React.useState<string>("toutes");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Resolve sources and normalize with year data
  const resolvedSources = React.useMemo(() => {
    const sourceMap = new Map<string, any>();
    (importSources || []).forEach((s: any) => {
      const possibleIds = [
        s?.id,
        s?.source_id, 
        s?.key,
        s?.nom,
        s?.name,
        s?.url?.split('/').pop(),
      ].filter(Boolean);
      
      possibleIds.forEach(id => {
        if (id) sourceMap.set(String(id), s);
      });
    });

    const resolved = referencedSourceIds
      .map(id => sourceMap.get(String(id)))
      .filter(Boolean)
      .map(normalizeYearFromSource);

    return resolved;
  }, [referencedSourceIds, importSources]);

  // Collect available years for filtering
  const availableYears = React.useMemo(() => 
    collectAvailableYears(resolvedSources), 
    [resolvedSources]
  );

  // Filter sources by selected year
  const filteredSources = React.useMemo(() => {
    if (selectedYear === "toutes") return resolvedSources;
    if (selectedYear === "inconnue") {
      return resolvedSources.filter(source => !source.year || source.yearDisplay === 'Inconnue');
    }
    return resolvedSources.filter(source => source.yearDisplay === selectedYear);
  }, [resolvedSources, selectedYear]);

  const getShortUrl = (url: string): string => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname.length > 20 ? 
        urlObj.pathname.substring(0, 17) + '...' : 
        urlObj.pathname;
      return domain + path;
    } catch {
      return url.length > 30 ? url.substring(0, 27) + '...' : url;
    }
  };

  return (
    <Card className={`border-success/30 bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-success font-bold">
          <Wrench className="h-5 w-5" />
          Sources technodiversité ({resolvedSources.length})
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="ml-auto border-success/30 text-success hover:bg-success/10"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-success flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Sources bibliographiques technodiversité ({filteredSources.length})
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {availableYears.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrer par année" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toutes">Toutes les années</SelectItem>
                        {availableYears
                          .filter(year => year !== "toutes")
                          .map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-3">
                  {filteredSources.map((source: SourceWithYear, index) => (
                    <Card key={index} className="border-success/20 bg-success/5">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-success line-clamp-2">
                                {generateShortName(source)}
                              </h4>
                              
                              {source.url && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span 
                                    className="text-sm text-muted-foreground truncate cursor-pointer hover:text-success"
                                    onClick={() => window.open(source.url, '_blank')}
                                  >
                                    {getShortUrl(source.url)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {source.year && (
                                <Badge variant="outline" className="border-success/30 text-success">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {source.yearDisplay}
                                </Badge>
                              )}
                              
                              {source.url && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-success/30 text-success hover:bg-success/10"
                                  onClick={() => window.open(source.url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {source.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {source.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredSources.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune source trouvée pour {selectedYear === "toutes" ? "cette sélection" : selectedYear}</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm !text-white italic">
          {resolvedSources.length > 0 ? 
            `${resolvedSources.slice(0, 2).map((s: SourceWithYear) => generateShortName(s)).join(', ')}${resolvedSources.length > 2 ? ` et ${resolvedSources.length - 2} autres` : ''}` :
            "Aucune source documentaire"
          }
        </div>
      </CardContent>
    </Card>
  );
};