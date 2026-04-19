import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EventsChatbotFab: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          disabled
          aria-label="Chatbot événements (bientôt disponible)"
          className="fixed bottom-4 right-4 z-30 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg opacity-50 cursor-not-allowed flex items-center justify-center"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p className="text-xs">Chatbot événements — bientôt disponible</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default EventsChatbotFab;
