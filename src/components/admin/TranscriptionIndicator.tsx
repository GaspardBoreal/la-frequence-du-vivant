import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

interface TranscriptionIndicatorProps {
  status?: string;
  confidence?: number;
  hasText?: boolean;
  onClick: () => void;
  compact?: boolean;
}

const TranscriptionIndicator: React.FC<TranscriptionIndicatorProps> = ({
  status,
  confidence,
  hasText,
  onClick,
  compact = false
}) => {
  const getIndicatorContent = () => {
    switch (status) {
      case 'completed':
        if (compact) {
          return {
            icon: <CheckCircle className="w-3 h-3" />,
            color: 'bg-green-500/20 text-green-700 border-green-300 hover:bg-green-500/30',
            label: '✓'
          };
        }
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-500/20 text-green-700 border-green-300 hover:bg-green-500/30',
          label: hasText ? 'Transcription disponible' : 'Transcrite'
        };
      
      case 'processing':
        if (compact) {
          return {
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            color: 'bg-blue-500/20 text-blue-700 border-blue-300 hover:bg-blue-500/30',
            label: '⏳'
          };
        }
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          color: 'bg-blue-500/20 text-blue-700 border-blue-300 hover:bg-blue-500/30',
          label: 'Transcription en cours...'
        };
      
      case 'failed':
        if (compact) {
          return {
            icon: <AlertCircle className="w-3 h-3" />,
            color: 'bg-red-500/20 text-red-700 border-red-300 hover:bg-red-500/30',
            label: '!'
          };
        }
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-red-500/20 text-red-700 border-red-300 hover:bg-red-500/30',
          label: 'Transcription échouée'
        };
      
      default:
        if (compact) {
          return {
            icon: <FileText className="w-3 h-3" />,
            color: 'bg-gray-500/20 text-gray-600 border-gray-300 hover:bg-gray-500/30',
            label: 'T'
          };
        }
        return {
          icon: <FileText className="w-4 h-4" />,
          color: 'bg-gray-500/20 text-gray-600 border-gray-300 hover:bg-gray-500/30',
          label: 'Lancer transcription'
        };
    }
  };

  const { icon, color, label } = getIndicatorContent();

  if (compact) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        className={`h-6 w-6 p-0 rounded-full transition-all duration-200 ${color}`}
        title={
          status === 'completed' && confidence 
            ? `Transcription disponible (${Math.round(confidence * 100)}% confiance)`
            : status === 'processing' 
            ? 'Transcription en cours...'
            : status === 'failed'
            ? 'Transcription échouée - Cliquer pour réessayer'
            : 'Cliquer pour lancer la transcription'
        }
      >
        {status === 'completed' && confidence ? (
          <span className="text-xs font-bold">
            {Math.round(confidence * 100)}
          </span>
        ) : (
          icon
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`transition-all duration-200 border ${color}`}
    >
      {icon}
      <span className="ml-2 text-xs">{label}</span>
      {status === 'completed' && confidence && (
        <Badge variant="secondary" className="ml-2 text-xs">
          {Math.round(confidence * 100)}%
        </Badge>
      )}
    </Button>
  );
};

export default TranscriptionIndicator;