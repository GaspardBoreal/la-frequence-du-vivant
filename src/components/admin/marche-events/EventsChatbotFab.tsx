import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DraggableFab from '@/components/ui/DraggableFab';

const EventsChatbotFab: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <DraggableFab id="events-chatbot-fab" size={48} zIndex={30}>
          <button
            disabled
            aria-label="Chatbot événements (bientôt disponible)"
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg opacity-50 cursor-not-allowed flex items-center justify-center"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </DraggableFab>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p className="text-xs">Chatbot événements — bientôt disponible</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default EventsChatbotFab;
