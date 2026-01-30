import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { TexteExport, EpubExportOptions } from '@/utils/epubExportUtils';
import { useBookPages } from './hooks/useBookPages';
import { useBookNavigation } from './hooks/useBookNavigation';
import LivreVivantNavigation from './LivreVivantNavigation';
import { 
  CoverRenderer, 
  PartieRenderer, 
  TexteRenderer, 
  TocRenderer,
  IndexRenderer 
} from './renderers';

interface LivreVivantViewerProps {
  isOpen: boolean;
  onClose: () => void;
  textes: TexteExport[];
  options: EpubExportOptions;
}

type DevicePreview = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DevicePreview, { width: string; height: string; label: string }> = {
  desktop: { width: '100%', height: '100%', label: 'Bureau' },
  tablet: { width: '768px', height: '1024px', label: 'Tablette' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' },
};

const LivreVivantViewer: React.FC<LivreVivantViewerProps> = ({
  isOpen,
  onClose,
  textes,
  options,
}) => {
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [showToc, setShowToc] = useState(false);

  const pages = useBookPages({ textes, options });
  const {
    currentPageIndex,
    currentPage,
    totalPages,
    goToPage,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    canGoNext,
    canGoPrevious,
    progress,
  } = useBookNavigation({ pages, onClose });

  const { colorScheme, typography } = options;

  // Render the current page based on its type
  const renderCurrentPage = () => {
    if (!currentPage) {
      return (
        <div 
          className="h-full flex items-center justify-center"
          style={{ backgroundColor: colorScheme.background, color: colorScheme.secondary }}
        >
          <p className="text-sm italic">Aucune page à afficher</p>
        </div>
      );
    }

    const commonProps = {
      colorScheme,
      typography,
      onNavigate: goToPage,
    };

    switch (currentPage.type) {
      case 'cover':
        return <CoverRenderer {...commonProps} data={currentPage.data as any} />;
      
      case 'toc':
        return <TocRenderer {...commonProps} data={currentPage.data as any} />;
      
      case 'partie':
        return <PartieRenderer {...commonProps} data={currentPage.data as any} />;
      
      case 'texte':
        return <TexteRenderer {...commonProps} data={currentPage.data as any} />;
      
      case 'index-lieu':
        return <IndexRenderer {...commonProps} data={currentPage.data as any} indexType="lieu" />;
      
      case 'index-genre':
        return <IndexRenderer {...commonProps} data={currentPage.data as any} indexType="genre" />;
      
      default:
        return (
          <div 
            className="h-full flex items-center justify-center"
            style={{ backgroundColor: colorScheme.background, color: colorScheme.secondary }}
          >
            <p className="text-sm">Page de type "{currentPage.type}" non supportée</p>
          </div>
        );
    }
  };

  const deviceSize = DEVICE_SIZES[devicePreview];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 gap-0 rounded-none border-0"
        style={{ backgroundColor: colorScheme.background }}
      >
        <VisuallyHidden>
          <DialogTitle>Livre Vivant - {options.title || 'Aperçu'}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ 
            borderColor: colorScheme.secondary + '20',
            backgroundColor: colorScheme.background,
          }}
        >
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium"
              style={{ color: colorScheme.primary }}
            >
              ← {currentPageIndex + 1}/{totalPages}
            </span>
            <span 
              className="text-xs hidden sm:inline"
              style={{ color: colorScheme.secondary }}
            >
              {currentPage?.title}
            </span>
          </div>

          <h2 
            className="text-sm font-medium tracking-wide uppercase hidden md:block"
            style={{ color: colorScheme.primary }}
          >
            Livre Vivant
          </h2>

          <div className="flex items-center gap-2">
            {/* Device preview toggles */}
            <div className="flex items-center gap-0.5 border rounded-md p-0.5" style={{ borderColor: colorScheme.secondary + '30' }}>
              {(Object.entries(DEVICE_SIZES) as [DevicePreview, typeof deviceSize][]).map(([key, value]) => {
                const Icon = key === 'desktop' ? Monitor : key === 'tablet' ? Tablet : Smartphone;
                return (
                  <Button
                    key={key}
                    variant={devicePreview === key ? 'default' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDevicePreview(key)}
                    title={value.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div 
          className="flex-1 overflow-hidden flex items-center justify-center p-4"
          style={{ backgroundColor: colorScheme.secondary + '10' }}
        >
          <motion.div
            layout
            className="bg-white shadow-2xl overflow-hidden"
            style={{
              width: deviceSize.width,
              height: deviceSize.height,
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: devicePreview !== 'desktop' ? '12px' : '0',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage?.id || 'empty'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderCurrentPage()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation */}
        <LivreVivantNavigation
          currentPageIndex={currentPageIndex}
          totalPages={totalPages}
          progress={progress}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onGoToFirst={goToFirst}
          onGoToLast={goToLast}
          onGoToPrevious={goToPrevious}
          onGoToNext={goToNext}
          onGoToPage={goToPage}
          onOpenToc={() => setShowToc(true)}
          colorScheme={colorScheme}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LivreVivantViewer;
