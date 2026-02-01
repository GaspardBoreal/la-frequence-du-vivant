import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Monitor, Tablet, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TexteExport, EpubExportOptions, EpubColorScheme } from '@/utils/epubExportUtils';
import TraverseesHub from '@/components/admin/TraverseesHub';
import { useBookPages } from '@/components/admin/livre-vivant/hooks/useBookPages';
import { useBookNavigation } from '@/components/admin/livre-vivant/hooks/useBookNavigation';
import LivreVivantNavigation from '@/components/admin/livre-vivant/LivreVivantNavigation';
import { 
  CoverRenderer, 
  PartieRenderer, 
  TexteRenderer, 
  TocRenderer,
  IndexRenderer 
} from '@/components/admin/livre-vivant/renderers';

interface PublicLivreVivantViewerProps {
  textes: TexteExport[];
  options: EpubExportOptions;
  backUrl: string;
  title?: string;
}

type DevicePreview = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DevicePreview, { width: string; height: string; label: string }> = {
  desktop: { width: '100%', height: '100%', label: 'Bureau' },
  tablet: { width: '768px', height: '1024px', label: 'Tablette' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' },
};

const PublicLivreVivantViewer: React.FC<PublicLivreVivantViewerProps> = ({
  textes,
  options,
  backUrl,
  title,
}) => {
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [isTraverseesOpen, setIsTraverseesOpen] = useState(false);

  const pages = useBookPages({ textes, options });
  const {
    currentPageIndex,
    currentPage,
    totalPages,
    goToPage,
    goToPageById,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    canGoNext,
    canGoPrevious,
    progress,
  } = useBookNavigation({ pages });

  // Navigation callbacks for reading modes
  const handleGoToToc = () => goToPageById('toc');
  const handleGoToIndex = (type: 'lieu' | 'genre') => goToPageById(`index-${type}`);
  const handleOpenTraversees = () => {
    setIsTraverseesOpen(true);
  };

  // Navigation from Traversées (Index Vivant) to a specific texte
  const handleNavigateToTexteFromTraversees = (texteId: string) => {
    setIsTraverseesOpen(false);
    goToPageById(`texte-${texteId}`);
  };

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
      onNavigateToPageId: goToPageById,
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
    <div 
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: colorScheme.background }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ 
          borderColor: colorScheme.secondary + '20',
          backgroundColor: colorScheme.background,
        }}
      >
        <div className="flex items-center gap-3">
          <Link to={backUrl}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              style={{ color: colorScheme.secondary }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </Link>
          <span 
            className="text-sm font-medium"
            style={{ color: colorScheme.primary }}
          >
            {currentPageIndex + 1}/{totalPages}
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
          {title || 'Livre Vivant'}
        </h2>

        <div className="flex items-center gap-2">
          {/* Device preview toggles */}
          <div 
            className="flex items-center gap-1 rounded-lg p-1"
            style={{ 
              backgroundColor: colorScheme.secondary + '15',
              border: `1px solid ${colorScheme.secondary}20`
            }}
          >
            {(Object.entries(DEVICE_SIZES) as [DevicePreview, typeof deviceSize][]).map(([key, value]) => {
              const Icon = key === 'desktop' ? Monitor : key === 'tablet' ? Tablet : Smartphone;
              const isActive = devicePreview === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setDevicePreview(key)}
                  className="relative flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200"
                  style={{
                    color: isActive ? colorScheme.primary : colorScheme.secondary,
                    backgroundColor: isActive ? colorScheme.background : 'transparent',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  }}
                  title={value.label}
                >
                  <Icon className="h-4 w-4" />
                  
                  {isActive && (
                    <motion.div
                      layoutId="public-device-indicator"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ backgroundColor: colorScheme.accent }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
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
        onOpenToc={handleGoToToc}
        onGoToIndex={handleGoToIndex}
        onOpenTraversees={handleOpenTraversees}
        colorScheme={colorScheme}
      />

      {/* Traversées overlay */}
      <AnimatePresence>
        {isTraverseesOpen && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: `${colorScheme.secondary}55` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsTraverseesOpen(false)}
          >
            <motion.div
              className="w-full max-w-5xl overflow-hidden rounded-xl border"
              style={{
                backgroundColor: colorScheme.background,
                borderColor: `${colorScheme.secondary}25`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              }}
              initial={{ scale: 0.98, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: `${colorScheme.secondary}20` }}
              >
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: colorScheme.primary }}>
                    Traversées immersives
                  </h3>
                  <p className="text-xs" style={{ color: colorScheme.secondary }}>
                    Sismographe poétique, Index vivant, et autres modes.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsTraverseesOpen(false)}
                  style={{ color: colorScheme.secondary }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-3">
                <TraverseesHub 
                  textes={textes} 
                  colorScheme={colorScheme} 
                  onNavigateToTexteId={handleNavigateToTexteFromTraversees}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicLivreVivantViewer;
