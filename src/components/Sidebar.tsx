
import React from 'react';
import { X, MapPin, Calendar, Euro, Home, Thermometer } from 'lucide-react';
import { SelectedParcel } from '../pages/Index';
import { RegionalTheme } from '../utils/regionalThemes';
import WeatherChart from './WeatherChart';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: SelectedParcel | null;
  theme: RegionalTheme;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, parcel, theme }) => {
  if (!isOpen || !parcel) return null;

  const { data } = parcel;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Détails de la parcelle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Location Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Localisation</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Ville:</span> {data.information?.city?.value || 'N/A'}</p>
              <p><span className="font-medium">Code postal:</span> {data.information?.['postal-code']?.value || 'N/A'}</p>
              <p><span className="font-medium">Pays:</span> {data.information?.country?.value || 'N/A'}</p>
              <p><span className="font-medium">Coordonnées:</span> {parcel.coordinates[0].toFixed(6)}, {parcel.coordinates[1].toFixed(6)}</p>
            </div>
          </div>

          {/* Cadastre Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Cadastre</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">ID:</span> {data.cadastre?.id?.value || 'N/A'}</p>
              <p><span className="font-medium">Section:</span> {data.cadastre?.section?.value || 'N/A'}</p>
              <p><span className="font-medium">Numéro:</span> {data.cadastre?.number?.value || 'N/A'}</p>
              <p><span className="font-medium">Surface:</span> {data.cadastre?.area?.value || 'N/A'} {data.cadastre?.area?.unit || ''}</p>
            </div>
          </div>

          {/* Weather */}
          {data['last-year-weather-reports'] && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Météo</h3>
              </div>
              <p className="text-sm mb-3">
                Station: {data['last-year-weather-reports'].station?.value || 'N/A'}
              </p>
              <WeatherChart data={data['last-year-weather-reports']} theme={theme} />
            </div>
          )}

          {/* Transactions */}
          {data.transactions?.rows && data.transactions.rows.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Euro className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Transactions récentes</h3>
              </div>
              <div className="space-y-3">
                {data.transactions.rows.slice(0, 5).map((transaction: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-800">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
