
import React from 'react';
import { X, MapPin, Calendar, TrendingUp, Thermometer, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RegionalTheme } from '../utils/regionalThemes';
import { SelectedParcel } from '../pages/Index';
import WeatherChart from './WeatherChart';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: SelectedParcel | null;
  theme: RegionalTheme;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, parcel, theme }) => {
  if (!isOpen || !parcel) return null;

  const data = parcel.data;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:transform-none overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Détails de la parcelle
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" style={{ color: theme.colors.primary }} />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Ville:</span>
                  <p className="text-gray-600">{data.information?.city?.value || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Code postal:</span>
                  <p className="text-gray-600">{data.information?.['postal-code']?.value || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Latitude:</span>
                  <p className="text-gray-600">{parcel.coordinates[0].toFixed(6)}</p>
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>
                  <p className="text-gray-600">{parcel.coordinates[1].toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cadastre Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" style={{ color: theme.colors.primary }} />
                Informations cadastrales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Identifiant:</span>
                  <p className="text-gray-600">{data.cadastre?.id?.value || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Section:</span>
                  <p className="text-gray-600">{data.cadastre?.section?.value || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Numéro:</span>
                  <p className="text-gray-600">{data.cadastre?.number?.value || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Superficie:</span>
                  <p className="text-gray-600">
                    {data.cadastre?.area?.value || 'N/A'} {data.cadastre?.area?.unit || ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Data */}
          {data['last-year-weather-reports'] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Thermometer className="h-4 w-4" style={{ color: theme.colors.primary }} />
                  Données météorologiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-3">
                  <span className="font-medium">Station:</span>
                  <p className="text-gray-600">{data['last-year-weather-reports'].station?.value || 'N/A'}</p>
                </div>
                <WeatherChart data={data['last-year-weather-reports']} theme={theme} />
              </CardContent>
            </Card>
          )}

          {/* Transactions */}
          {data.transactions?.rows && data.transactions.rows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" style={{ color: theme.colors.primary }} />
                  Transactions récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.transactions.rows.map((transaction: any, index: number) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">
                          {transaction['building-nature']?.value || 'N/A'}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {transaction.price?.value?.toLocaleString() || 'N/A'} {transaction.price?.unit || ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {transaction.address?.value || 'Adresse inconnue'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.date?.value || 'Date inconnue'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
