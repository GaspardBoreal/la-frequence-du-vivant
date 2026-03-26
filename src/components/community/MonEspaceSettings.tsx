import React from 'react';
import { LogOut, User, MapPin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import RoleBadge from './RoleBadge';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';

interface MonEspaceSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prenom: string;
  nom: string;
  email: string;
  ville: string | null;
  role: CommunityRoleKey;
  onSignOut: () => void;
}

const MonEspaceSettings: React.FC<MonEspaceSettingsProps> = ({
  open, onOpenChange, prenom, nom, email, ville, role, onSignOut,
}) => {
  const initials = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-emerald-950 border-l border-white/10 text-white w-80">
        <SheetHeader>
          <SheetTitle className="text-white">Mon profil</SheetTitle>
          <SheetDescription className="text-emerald-200/50">Vos informations personnelles</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-600/40 border-2 border-emerald-400/30 flex items-center justify-center text-emerald-100 font-bold text-2xl">
              {initials}
            </div>
            <RoleBadge role={role} size="md" darkMode />
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
              <User className="w-4 h-4 text-emerald-300/60 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-200/40">Nom</p>
                <p className="text-sm text-white">{prenom} {nom}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
              <Mail className="w-4 h-4 text-emerald-300/60 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-200/40">Email</p>
                <p className="text-sm text-white/80 truncate">{email}</p>
              </div>
            </div>

            {ville && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <MapPin className="w-4 h-4 text-emerald-300/60 flex-shrink-0" />
                <div>
                  <p className="text-xs text-emerald-200/40">Ville</p>
                  <p className="text-sm text-white">{ville}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sign out */}
          <Button
            variant="outline"
            onClick={() => { onSignOut(); onOpenChange(false); }}
            className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MonEspaceSettings;
