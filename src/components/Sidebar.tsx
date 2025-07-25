import React from 'react';
import { X, MapPin, Calendar, Thermometer } from 'lucide-react';
import { Button } from './ui/button';
import { SelectedParcel } from '../types/index';
import PoeticPhotoGallery from './PoeticPhotoGallery';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedParcel: SelectedParcel | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, selectedParcel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-card/95 backdrop-blur-md z-50 shadow-lg transform transition-transform duration-300 ease-in-out">
      {/* Barre supérieure de la sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <span className="font-bold text-lg text-white">
          {selectedParcel ? 'Parcelle sélectionnée' : 'Informations'}
        </span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Contenu principal de la sidebar */}
      <div className="p-6 overflow-y-auto h-[calc(100%-56px)]">
        {selectedParcel ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">{selectedParcel.name}</h2>
            <PoeticPhotoGallery imageUrls={selectedParcel.imageUrls} />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-white">{selectedParcel.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin size={16} className="inline-block mr-1" />
                  Localisation
                </p>
                <p className="text-white">{selectedParcel.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar size={16} className="inline-block mr-1" />
                  Date
                </p>
                <p className="text-white">{selectedParcel.date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Thermometer size={16} className="inline-block mr-1" />
                  Température
                </p>
                <p className="text-white">{selectedParcel.temperature}°C</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Aucune parcelle sélectionnée. Veuillez cliquer sur une parcelle sur la carte pour afficher les
            informations.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
