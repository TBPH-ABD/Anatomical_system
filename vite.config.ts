import {fileURLToPath} from 'node:url';
import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

/** Serves POST /api/explain during `npm run dev` with the same code the
 * deployed serverless function runs, so the explain button is testable locally
 * whenever ANTHROPIC_API_KEY is set. */
const explainApi = (): Plugin => ({
  name: 'anatomy-explain-api',
  configureServer(server) {
    server.middlewares.use('/api/explain', async (request, response, next) => {
      if (request.method !== 'POST') return next();
      try {
        // Absolute path: the dev server's root is web/, not the project root.
        const {explainStructure, readJsonBody} = await server.ssrLoadModule(path('./server/explain.ts'));
        const result = await explainStructure(await readJsonBody(request));
        response.statusCode = result.status;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(result.body));
      } catch (error) {
        server.config.logger.error(`explain api: ${(error as Error).message}`);
        response.statusCode = 400;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({error: 'bad_request'}));
      }
    });
  },
});

export default defineConfig({
  root: path('./web'),
  publicDir: path('./public'),
  plugins: [react(), explainApi()],
  resolve: {alias: {'@': path('./')}},
  css: {postcss: {plugins: [tailwindcss()]}},
  server: {watch: {usePolling: true}, fs: {allow: [path('./')]}},
  build: {outDir: path('./dist'), emptyOutDir: true},
});
