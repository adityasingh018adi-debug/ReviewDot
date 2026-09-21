import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Bundles the app into a single JS + CSS pair with fonts inlined, so the whole
 * product can be published as a self-contained preview.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: { alias: { '@': path.resolve(dirname, './src') } },
  build: {
    outDir: process.env.PREVIEW_OUT ?? 'dist-preview',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
