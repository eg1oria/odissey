// Клиент Internet Archive: только фильмы в общественном достоянии
// из коллекции feature_films. API бесплатное и не требует ключа.

const BASE = "https://archive.org";
const REVALIDATE = 60 * 60 * 6; // 6 часов

export type MovieSummary = {
  id: string;
  title: string;
  year?: string;
  downloads?: number;
};

export type Movie = MovieSummary & {
  description: string;
  runtime?: string;
  creator?: string;
  subjects: string[];
  videos: { url: string; type: string; label: string }[];
};

export type Sort = "popular" | "newest" | "oldest" | "title";

const SORTS: Record<Sort, string> = {
  popular: "downloads desc",
  newest: "year desc",
  oldest: "year asc",
  title: "titleSorter asc",
};

export const GENRES = [
  { slug: "horror", label: "Ужасы", query: "horror" },
  { slug: "comedy", label: "Комедии", query: "comedy" },
  { slug: "sci-fi", label: "Фантастика", query: '"science fiction" OR sci-fi' },
  { slug: "noir", label: "Нуар", query: "noir" },
  { slug: "western", label: "Вестерны", query: "western" },
  { slug: "drama", label: "Драмы", query: "drama" },
  { slug: "crime", label: "Криминал", query: "crime" },
  { slug: "war", label: "Военные", query: "war" },
  { slug: "adventure", label: "Приключения", query: "adventure" },
  { slug: "animation", label: "Мультфильмы", query: "animation OR cartoon" },
] as const;

export type GenreSlug = (typeof GENRES)[number]["slug"];

export function findGenre(slug?: string) {
  return GENRES.find((g) => g.slug === slug);
}

export function posterUrl(id: string) {
  return `${BASE}/services/img/${encodeURIComponent(id)}`;
}

export function archivePageUrl(id: string) {
  return `${BASE}/details/${encodeURIComponent(id)}`;
}

function escapeQuery(text: string) {
  return text.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ").trim();
}

function first(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0] != null ? String(value[0]) : undefined;
  return value != null ? String(value) : undefined;
}

function list(value: unknown): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .flatMap((v) => String(v).split(/[;,]/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Убирает HTML из описаний архива, сохраняя переносы строк. */
export function cleanText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type SearchParams = {
  query?: string;
  genre?: string;
  sort?: Sort;
  page?: number;
  rows?: number;
};

export type SearchResult = {
  movies: MovieSummary[];
  total: number;
  page: number;
  pages: number;
  error?: boolean;
};

export async function searchMovies({
  query,
  genre,
  sort = "popular",
  page = 1,
  rows = 30,
}: SearchParams = {}): Promise<SearchResult> {
  const parts = ["collection:feature_films", "mediatype:movies"];
  const text = query ? escapeQuery(query) : "";
  if (text) parts.push(`(title:(${text}) OR description:(${text}))`);
  const g = findGenre(genre);
  if (g) parts.push(`subject:(${g.query})`);

  const params = new URLSearchParams({
    q: parts.join(" AND "),
    rows: String(rows),
    page: String(page),
    output: "json",
  });
  for (const field of ["identifier", "title", "year", "downloads"]) {
    params.append("fl[]", field);
  }
  params.append("sort[]", SORTS[sort] ?? SORTS.popular);

  try {
    const res = await fetch(`${BASE}/advancedsearch.php?${params}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) throw new Error(`archive.org ответил ${res.status}`);
    const data = await res.json();
    const docs: Record<string, unknown>[] = data?.response?.docs ?? [];
    const total: number = data?.response?.numFound ?? 0;
    return {
      movies: docs.map((d) => ({
        id: String(d.identifier),
        title: first(d.title) ?? String(d.identifier),
        year: first(d.year),
        downloads: typeof d.downloads === "number" ? d.downloads : undefined,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / rows)),
    };
  } catch (err) {
    console.error("searchMovies:", err);
    return { movies: [], total: 0, page, pages: 1, error: true };
  }
}

type ArchiveFile = {
  name: string;
  format?: string;
  source?: string;
  size?: string;
};

// Порядок = приоритет формата для браузерного плеера.
const VIDEO_FORMATS: { match: (f: ArchiveFile) => boolean; label: string; type: string }[] = [
  { match: (f) => f.format === "h.264" || f.format === "h.264 HD", label: "MP4 (H.264)", type: "video/mp4" },
  { match: (f) => f.format === "MPEG4" && f.name.endsWith(".mp4"), label: "MP4", type: "video/mp4" },
  { match: (f) => f.format === "512Kb MPEG4", label: "MP4 (эконом)", type: "video/mp4" },
  { match: (f) => /\.mp4$/i.test(f.name), label: "MP4", type: "video/mp4" },
  { match: (f) => /\.webm$/i.test(f.name), label: "WebM", type: "video/webm" },
  { match: (f) => /\.ogv$/i.test(f.name), label: "Ogg", type: "video/ogg" },
];

function pickVideos(id: string, files: ArchiveFile[]) {
  const seen = new Set<string>();
  const result: Movie["videos"] = [];
  for (const format of VIDEO_FORMATS) {
    const matches = files.filter((f) => format.match(f) && !seen.has(f.name));
    // Если фильм разбит на части, берём самую большую как основную.
    matches.sort((a, b) => Number(b.size ?? 0) - Number(a.size ?? 0));
    const file = matches[0];
    if (!file) continue;
    seen.add(file.name);
    result.push({
      url: `${BASE}/download/${encodeURIComponent(id)}/${file.name
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      type: format.type,
      label: format.label,
    });
  }
  return result;
}

export async function getMovie(id: string): Promise<Movie | null> {
  try {
    const res = await fetch(`${BASE}/metadata/${encodeURIComponent(id)}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.metadata;
    if (!meta) return null;
    return {
      id,
      title: first(meta.title) ?? id,
      year: first(meta.year) ?? first(meta.date)?.slice(0, 4),
      downloads: data?.item?.downloads,
      description: cleanText([meta.description ?? ""].flat().join("\n\n")),
      runtime: first(meta.runtime),
      creator: first(meta.creator),
      subjects: list(meta.subject).slice(0, 12),
      videos: pickVideos(id, data.files ?? []),
    };
  } catch (err) {
    console.error("getMovie:", err);
    return null;
  }
}
