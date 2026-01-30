import { useState, useCallback, useEffect } from 'react';
import type { BookPage } from '@/registries/types';

interface UseBookNavigationProps {
  pages: BookPage[];
  onClose?: () => void;
}

interface UseBookNavigationReturn {
  currentPageIndex: number;
  currentPage: BookPage | null;
  totalPages: number;
  goToPage: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
}

export const useBookNavigation = ({ 
  pages, 
  onClose 
}: UseBookNavigationProps): UseBookNavigationReturn => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const totalPages = pages.length;
  const currentPage = pages[currentPageIndex] || null;
  const canGoNext = currentPageIndex < totalPages - 1;
  const canGoPrevious = currentPageIndex > 0;
  const progress = totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;

  const goToPage = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, totalPages - 1));
    setCurrentPageIndex(clampedIndex);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentPageIndex(prev => prev + 1);
    }
  }, [canGoNext]);

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentPageIndex(prev => prev - 1);
    }
  }, [canGoPrevious]);

  const goToFirst = useCallback(() => {
    setCurrentPageIndex(0);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentPageIndex(totalPages - 1);
  }, [totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Home':
          e.preventDefault();
          goToFirst();
          break;
        case 'End':
          e.preventDefault();
          goToLast();
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, goToFirst, goToLast, onClose]);

  return {
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
  };
};

export default useBookNavigation;
