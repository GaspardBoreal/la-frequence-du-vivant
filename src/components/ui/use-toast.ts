
import { toast } from "sonner";

export { toast };

// Compatibility with shadcn/ui toast hook pattern
export const useToast = () => {
  return {
    toast,
    dismiss: (id?: string) => {
      // Sonner dismiss functionality
      console.log('Toast dismissed:', id);
    },
    toasts: [] // Empty array for compatibility
  };
};
