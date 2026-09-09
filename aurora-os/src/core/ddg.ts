export interface DdgResult {
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

export function parseDdgHtml(html: string): DdgResult[] {
  const results: DdgResult[] = [];
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