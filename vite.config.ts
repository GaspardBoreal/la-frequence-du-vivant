import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (/[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet|leaflet\.)/.test(id)) {
            return 'maps';
          }
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-)/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          if (/[\\/]node_modules[\\/](@supabase)[\\/]/.test(id)) return 'supabase';
          if (/[\\/]node_modules[\\/](@radix-ui|cmdk|vaul|embla-carousel|lucide-react)/.test(id)) return 'ui';
          if (/[\\/]node_modules[\\/](docx|xlsx|jszip|jspdf|html2canvas|qrcode|@babel[\\/]standalone)/.test(id)) {
            return 'exports';
          }
        },
      },
    },
  },
}));
