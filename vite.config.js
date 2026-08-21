import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Bundled as a single self-contained index.html on build (no separate JS/CSS
// files) so deploying it is just "drag one file into GitHub / Netlify" —
// same workflow as the original static version, no build pipeline for
// whoever hosts it.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
})
