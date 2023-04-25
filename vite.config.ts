import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { VitePluginFonts } from 'vite-plugin-fonts'

// https://vitejs.dev/config/
export default defineConfig({
  base: 'https://kianenigma.github.io/polkadot-release-inspector/',
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgrPlugin(),
    VitePluginFonts({
      google: {
        families: ['Unbounded'],
      },
    }),
  ],
  server: {
    port: 3006,
  },
});
