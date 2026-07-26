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
        // Le socle React est isolé en premier : sinon Rollup le place dans le
        // premier gros chunk venu (ex. Babel), qui devient alors obligatoire
        // pour toutes les pages. Les autres groupes restent des librairies
        // « feuilles » pour éviter les cycles entre chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-is|use-sync-external-store|object-assign)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (/[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet|leaflet\.)/.test(id)) {
            return 'maps';
          }
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-)/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](docx|xlsx|jszip|jspdf|jspdf-autotable|html2canvas|qrcode)[\\/]/.test(id)) {
            return 'exports';
          }
        },
      },
    },
  },
}));
