// Каталог фильмов, собранный из Wikidata скриптом scripts/build-catalog.mjs.
// Живёт только на сервере: в браузер уходят лишь нужные карточки.
import "server-only";
import raw from "@/data/catalog.json";

type RawFilm = {
  id: string;
  t: string;
  o?: string;
  y?: number;
  d?: string;
  m?: number;
  p?: string;
  w?: string;
  g?: string[];
  c?: string[];
  r?: string[];
  sc?: string[];
  sy?: string[];
  sa?: string[];
};

export type SourceKind = "commons" | "youtube" | "archive";

export type Source = {
  kind: SourceKind;
  label: string;
  /** Прямая ссылка на видеофайл (для <video>) или адрес для <iframe>. */
  url: string;
  player: "video" | "iframe";
  pageUrl: string;
};

export type Film = {
  id: string;
  title: string;
  original?: string;
  year?: number;
  description?: string;
  duration?: number;
  genres: string[];
  countries: string[];
  directors: string[];
  wiki?: string;
  poster?: string;
  sources: Source[];
};

export type FilmCard = Pick<Film, "id" | "title" | "year" | "poster"> & {
  kinds: SourceKind[];
};

export const SOURCE_LABELS: Record<SourceKind, string> = {
  commons: "Wikimedia",
  youtube: "YouTube",
  archive: "Internet Archive",
};

const commonsPath = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}`;

function posterFor(f: RawFilm): string | undefined {
  if (f.p) return `${commonsPath(f.p)}?width=342`;
  // Для видео Commons по ?width отдаёт кадр из фильма.
  if (f.sc?.[0]) return `${commonsPath(f.sc[0])}?width=342`;
  if (f.sy?.[0]) return `https://i.ytimg.com/vi/${f.sy[0]}/hqdefault.jpg`;
  if (f.sa?.[0]) return `https://archive.org/services/img/${encodeURIComponent(f.sa[0])}`;
  return undefined;
}

function sourcesFor(f: RawFilm): Source[] {
  const out: Source[] = [];
  f.sc?.forEach((file, i) =>
    out.push({
      kind: "commons",
      label: f.sc!.length > 1 ? `Wikimedia ${i + 1}` : "Wikimedia",
      url: commonsPath(file),
      player: "video",
      pageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`,
    }),
  );
  f.sy?.forEach((id, i) =>
    out.push({
      kind: "youtube",
      label: f.sy!.length > 1 ? `YouTube ${i + 1}` : "YouTube",
      url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
      player: "iframe",
      pageUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    }),
  );
  f.sa?.forEach((id, i) =>
    out.push({
      kind: "archive",
      label: f.sa!.length > 1 ? `Internet Archive ${i + 1}` : "Internet Archive",
      url: `https://archive.org/embed/${encodeURIComponent(id)}`,
      player: "iframe",
      pageUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
    }),
  );
  return out;
}

const FILMS = raw as RawFilm[];
const BY_ID = new Map(FILMS.map((f) => [f.id, f]));

function kindsOf(f: RawFilm): SourceKind[] {
  const kinds: SourceKind[] = [];
  if (f.sc) kinds.push("commons");
  if (f.sy) kinds.push("youtube");
  if (f.sa) kinds.push("archive");
  return kinds;
}

function toCard(f: RawFilm): FilmCard {
  return { id: f.id, title: f.t, year: f.y, poster: posterFor(f), kinds: kindsOf(f) };
}

export function getFilm(id: string): Film | null {
  const f = BY_ID.get(id);
  if (!f) return null;
  return {
    id: f.id,
    title: f.t,
    original: f.o,
    year: f.y,
    description: f.d,
    duration: f.m,
    genres: f.g ?? [],
    countries: f.c ?? [],
    directors: f.r ?? [],
    wiki: f.w,
    poster: posterFor(f),
    sources: sourcesFor(f),
  };
}

// Жанры и страны, у которых достаточно фильмов для отдельной страницы.
function topValues(pick: (f: RawFilm) => string[] | undefined, limit: number) {
  const counts = new Map<string, number>();
  for (const f of FILMS) for (const v of pick(f) ?? []) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export const GENRES = topValues((f) => f.g, 24);
export const COUNTRIES = topValues((f) => f.c, 16);
export const TOTAL = FILMS.length;

export type Sort = "popular" | "newest" | "oldest" | "title";

// «Популярность» без внешних данных: фильмы с русским описанием, постером
// и несколькими источниками обычно известнее.
function score(f: RawFilm) {
  return (
    (f.w ? 4 : 0) +
    (f.p ? 3 : 0) +
    (f.d ? 1 : 0) +
    (f.g?.length ? 1 : 0) +
    kindsOf(f).length * 2 +
    (/[а-яё]/i.test(f.t) ? 1 : 0)
  );
}

const SORTERS: Record<Sort, (a: RawFilm, b: RawFilm) => number> = {
  popular: (a, b) => score(b) - score(a) || (b.y ?? 0) - (a.y ?? 0),
  newest: (a, b) => (b.y ?? 0) - (a.y ?? 0),
  oldest: (a, b) => (a.y ?? 9999) - (b.y ?? 9999),
  title: (a, b) => a.t.localeCompare(b.t, "ru"),
};

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export type Query = {
  q?: string;
  genre?: string;
  country?: string;
  source?: SourceKind;
  decade?: number;
  sort?: Sort;
  page?: number;
  perPage?: number;
  exclude?: string;
};

export function searchFilms({
  q,
  genre,
  country,
  source,
  decade,
  sort = "popular",
  page = 1,
  perPage = 36,
  exclude,
}: Query = {}) {
  const needle = q ? normalize(q.trim()) : "";
  const list = FILMS.filter(
    (f) =>
      f.id !== exclude &&
      (!needle ||
        normalize(f.t).includes(needle) ||
        (f.o && normalize(f.o).includes(needle)) ||
        f.r?.some((d) => normalize(d).includes(needle))) &&
      (!genre || f.g?.includes(genre)) &&
      (!country || f.c?.includes(country)) &&
      (!source || kindsOf(f).includes(source)) &&
      (!decade || (f.y != null && f.y >= decade && f.y < decade + 10)),
  ).sort(SORTERS[sort] ?? SORTERS.popular);

  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const start = (page - 1) * perPage;
  return {
    films: list.slice(start, start + perPage).map(toCard),
    total: list.length,
    page,
    pages,
  };
}

/** Короткое описание из русской Википедии (если есть статья). */
export async function getWikiSummary(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { next: { revalidate: 60 * 60 * 24 * 7 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.extract === "string" && data.extract ? data.extract : null;
  } catch {
    return null;
  }
}
