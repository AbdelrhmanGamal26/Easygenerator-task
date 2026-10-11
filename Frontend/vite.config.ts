import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendOrigin = loadEnv(mode, process.cwd(), '').VITE_BACKEND_BASE_URL;
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // react-toastify sets inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src 'self' ${backendOrigin ?? ''}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-csp',
        apply: 'build',
        // Skipped in dev, where Vite's HMR needs inline scripts.
        transformIndexHtml: () => [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
            injectTo: 'head-prepend',
          },
        ],
      },
    ],
    test: { environment: 'jsdom', css: false },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
