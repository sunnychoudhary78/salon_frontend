import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = String(env.VITE_IS_PRODUCTION || '').toLowerCase() === 'true'
  const base = env.VITE_FRONTEND_BASE_PATH 
  return {
    base,
    build: {
      outDir: isProd ? 'lms-adminpanel' : 'uatlms-adminpanel',
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-icons')) return 'icons-vendor';
              if (id.includes('lucide')) return 'icons-lucide';
              if (id.includes('react')) return 'react-vendor';
              if (id.includes('react-router')) return 'router';
              if (id.includes('@radix-ui')) return 'radix';
              if (id.includes('axios')) return 'network';
              if (id.includes('recharts')) return 'recharts';
              if (id.includes('date-fns')) return 'date-fns';
            }
          }
        }
      }
    },
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),

      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})