import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file output so the built game can be opened/shared as one self-contained HTML file.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
  },
})
