export interface Book {
  id: string;
  title: string;
  authors: string[];
  publisher: string;
  description: string;
  thumbnail: string;
  publishedDate: string;
  pageCount: number;
  categories: string[];
  previewLink: string;
}

export async function searchBooks(query: string): Promise<Book[]> {
  if (!query.trim()) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const qs = new URLSearchParams({ q: query.trim(), maxResults: '20', langRestrict: 'es' });
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${qs}`, { signal: controller.signal });
    if (!res.ok) throw new Error('books failed');
    const data: { items?: Array<Record<string, unknown>> } = await res.json();
    return (data.items ?? [])
      .map(it => {
        const v = (it.volumeInfo ?? {}) as Record<string, unknown>;
        const imageLinks = v.imageLinks as Record<string, string> | undefined;
        return {
          id: String(it.id ?? ''),
          title: String(v.title ?? 'Sin título'),
          authors: Array.isArray(v.authors) ? v.authors.map(String) : [],
          publisher: String(v.publisher ?? ''),
          description: String(v.description ?? '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 400),
          thumbnail: String(imageLinks?.smallThumbnail ?? imageLinks?.thumbnail ?? ''),
          publishedDate: String(v.publishedDate ?? ''),
          pageCount: Number(v.pageCount) || 0,
          categories: Array.isArray(v.categories) ? v.categories.map(String) : [],
          previewLink: String(v.previewLink ?? ''),
        };
      })
      .filter(b => b.title !== 'Sin título');
  } finally {
    clearTimeout(timer);
  }
}