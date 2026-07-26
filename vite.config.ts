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
        // Regroupements volontairement limités aux librairies « feuilles »
        // (sans dépendances croisées) : découper React/Radix provoque des
        // cycles entre chunks et des erreurs d'initialisation au runtime.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](leaflet|react-leaflet|@react-leaflet|leaflet\.)/.test(id)) {
            return 'maps';
          }
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-)/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](docx|xlsx|jszip|jspdf|jspdf-autotable|html2canvas|qrcode)[\\/]/.test(id)) {
            return 'exports';
          }
          if (/[\\/]node_modules[\\/]@babel[\\/]standalone/.test(id)) return 'babel-standalone';
        },
      },
    },
  },
}));
