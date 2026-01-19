import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Loader2, RefreshCw, MapPin, Clock, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCalendarSync, CalendarEvent } from '@/hooks/useCalendarSync';
import { toast } from 'sonner';

const AutomationsAdmin: React.FC = () => {
  const { syncCalendar, loading, lastSync } = useCalendarSync();

  const handleTestSync = async () => {
    const result = await syncCalendar();
    
    if (result.success) {
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(`${result.events?.length || 0} événement(s) récupéré(s)`);
      }
    } else {
      toast.error(result.error || 'Erreur de synchronisation');
    }
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatLastSyncTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Determine status badge
  const getStatusBadge = () => {
    if (!lastSync) return null;
    
    if (!lastSync.success) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Erreur
        </Badge>
      );
    }
    
    if (lastSync.warning) {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 bg-amber-50">
          <AlertTriangle className="h-3 w-3" />
          Avertissement
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Connecté
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automations & Intégrations</h1>
            <p className="text-muted-foreground text-sm">Gérer les connexions externes et workflows automatisés</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Google Calendar Sync Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Planning Gaspard Boréal</CardTitle>
                    <CardDescription>Synchronisation Google Calendar via n8n</CardDescription>
                  </div>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Action Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleTestSync} 
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Tester la synchronisation
                    </>
                  )}
                </Button>
                
                {lastSync?.syncedAt && (
                  <span className="text-sm text-muted-foreground">
                    Dernier test : {formatLastSyncTime(lastSync.syncedAt)}
                  </span>
                )}
              </div>

              {/* Warning Display */}
              {lastSync?.warning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">{lastSync.warning}</p>
                </div>
              )}

              {/* Error Display */}
              {lastSync?.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{lastSync.error}</p>
                </div>
              )}

              {/* Events List */}
              {lastSync?.success && lastSync.events && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Événements récupérés ({lastSync.events.length})
                    </h4>
                    
                    {lastSync.events.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Aucun événement dans les 90 prochains jours
                      </p>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {lastSync.events.map((event: CalendarEvent) => (
                            <div 
                              key={event.id}
                              className="p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {event.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatEventDate(event.start)}
                                    {event.end && ` → ${formatEventDate(event.end)}`}
                                  </p>
                                  {event.location && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </>
              )}

              {/* Help Text */}
              {!lastSync && (
                <p className="text-sm text-muted-foreground">
                  Cliquez sur "Tester la synchronisation" pour vérifier la connexion avec Google Calendar.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Future Automations Placeholder */}
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg text-muted-foreground">Prochaines intégrations</CardTitle>
                  <CardDescription>D'autres automations seront ajoutées ici</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Module Automations - Gaspard Boréal © 2025 - 2026</p>
        </div>
      </div>
    </div>
  );
};

export default AutomationsAdmin;
