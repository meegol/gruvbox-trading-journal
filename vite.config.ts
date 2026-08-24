import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/fundednext-mcp')) {
          try {
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', async () => {
              (req as any).body = body;
              const { default: handler } = await import('./api/fundednext-mcp.ts');
              await handler(req, res);
            });
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
  base: '/',
})


