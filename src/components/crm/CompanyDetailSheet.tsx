import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CompanyDetailContent } from './CompanyDetailContent';

interface Props {
  companyId: string | null;
  onOpenChange: (open: boolean) => void;
}

export const CompanyDetailSheet: React.FC<Props> = ({ companyId, onOpenChange }) => {
  const open = !!companyId;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <CompanyDetailContent
          companyId={companyId}
          onClose={() => onOpenChange(false)}
          mode="sheet"
        />
      </SheetContent>
    </Sheet>
  );
};
