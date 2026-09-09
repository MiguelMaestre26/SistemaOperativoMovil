import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

function textFrom(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function realUrl(href: string): string {
  const h = decodeEntities(href);
  if (h.includes('/l/?uddg=')) {
    const m = h.match(/[?&]uddg=([^&]+)/i);
    if (m?.[1]) {
      try {
        return decodeURIComponent(m[1]);
      } catch {
        /* keep raw */
      }
    }
  }
  return h.startsWith('//') ? `https:${h}` : h;
}

function parseDdgResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  const titles = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)];
  const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)];
  titles.forEach((m, i) => {
    results.push({
      title: textFrom(m[2]),
      url: realUrl(m[1]),
      snippet: snippets[i] ? textFrom(snippets[i][2]) : '',
    });
  });
  return results.filter(r => r.title && r.url.startsWith('http'));
}

function devWebProxy(): Plugin {
  return {
    name: 'aurora-dev-web-proxy',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? '/', 'http://localhost');

        if (url.pathname === '/proxy') {
          const target = url.searchParams.get('url') ?? '';
          if (!target) {
            res.statusCode = 400;
            res.end('missing url');
            return;
          }
          try {
            const r = await fetch(target, {
              headers: {
                'User-Agent': UA,
                'Accept-Language': 'es-ES,es;q=0.9',
                Accept: '*/*',
              },
              redirect: 'follow',
            });
            res.statusCode = r.status;
            const ct = r.headers.get('content-type');
            if (ct) res.setHeader('content-type', ct);
            res.end(Buffer.from(await r.arrayBuffer()));
          } catch (e) {
            res.statusCode = 502;
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.end(e instanceof Error ? e.message : String(e));
          }
          return;
        }

        if (url.pathname === '/search') {
          const q = url.searchParams.get('q') ?? '';
          if (!q) {
            res.statusCode = 400;
            res.end('missing q');
            return;
          }
          res.setHeader('content-type', 'application/json; charset=utf-8');
          try {
            const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
              headers: {
                'User-Agent': UA,
                'Accept-Language': 'es-ES,es;q=0.9',
              },
            });
            const html = await r.text();
            res.end(JSON.stringify({ query: q, results: parseDdgResults(html).slice(0, 8) }));
          } catch (e) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), devWebProxy()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: false,
        rewrite: (path: string) => path.replace(/^\/ollama/, ''),
      },
    },
  },
});