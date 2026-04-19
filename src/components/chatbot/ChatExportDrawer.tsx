import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Copy, Share2 } from 'lucide-react';
import { ChatPrintPreview } from './ChatPrintView';
import { useChatExport } from './useChatExport';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatConfig } from './chatConfig';

type Msg = { role: 'user' | 'assistant'; content: string };

interface ChatExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Msg[];
}

export function ChatExportDrawer({ open, onOpenChange, messages }: ChatExportDrawerProps) {
  const { exportCopy, exportShare, canShare } = useChatExport(messages);

  const handleCopy = async () => {
    await exportCopy();
    onOpenChange(false);
  };

  const handleShare = async () => {
    await exportShare();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>{chatConfig.assistantEmoji}</span>
            Exporter la conversation
          </DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 max-h-[55vh]">
          <ChatPrintPreview messages={messages} />
        </ScrollArea>
        <DrawerFooter className="pt-3 pb-6 gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="h-12 w-full gap-2 text-sm font-medium border-primary/20 hover:bg-primary/5"
          >
            <Copy className="h-4 w-4" />
            Copier la conversation
          </Button>
          {canShare && (
            <Button
              onClick={handleShare}
              className="h-12 w-full gap-2 text-sm font-medium bg-primary hover:bg-primary/90"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
