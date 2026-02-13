import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/meetfix/',
  server: {
    // existing server settings here...
  },
  plugins: [vue(), /* other plugins */],
  resolve: {
    alias: {
      // existing path aliases here...
    },
  },
});
