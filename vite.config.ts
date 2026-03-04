import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: '.',
  publicDir: 'public',
  define: {
    // ===== SUPABASE CONFIGURATION (RUNTIME, NÃO BUILD-TIME) =====
    // 
    // IMPORTANTE: Estas variáveis PODEM estar vazias propositalmente!
    // 
    // O frontend agora busca credenciais Supabase via API em RUNTIME:
    // - GET /api/config/supabase (não-autenticado, rate-limited)
    // - Credenciais armazenadas em PostgreSQL (tabela app_settings)
    // - Elimina dependência de Secrets durante build
    // 
    // Prioridades (ver src/lib/supabase.ts):
    // 1. API backend (runtime) - PostgreSQL app_settings
    // 2. Variáveis de ambiente (fallback durante migração)
    // 3. localStorage (fallback legado)
    // 
    // É SEGURO deixar vazio - aplicação funciona com graceful degradation
    'import.meta.env.REACT_APP_SUPABASE_URL': JSON.stringify(
      process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || ''
    ),
    'import.meta.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || ''
    ),
  },
  
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || '5000', 10),
    strictPort: false,
    allowedHosts: true,
    hmr: process.env.REPLIT_DEV_DOMAIN ? {
      protocol: 'wss',
      host: process.env.REPLIT_DEV_DOMAIN,
      clientPort: 443,
      timeout: 120000,
    } : true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: undefined,
      },
    },
    chunkSizeWarningLimit: 500,
  },
  plugins: [tsconfigPaths(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
}));