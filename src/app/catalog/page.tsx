import type { Metadata } from "next";
import Link from "next/link";
import FilmGrid from "@/components/FilmGrid";
import { COUNTRIES, GENRES, SOURCE_LABELS, searchFilms, type Sort, type SourceKind } from "@/lib/catalog";

const SORT_LABELS: Record<Sort, string> = {
  popular: "Популярные",
  newest: "Сначала новые",
  oldest: "Сначала старые",
  title: "По названию",
};

const DECADES = [1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

type Params = { q?: string; genre?: string; country?: string; source?: string; decade?: string; sort?: string; page?: string };
const KEYS = ["q", "genre", "country", "source", "decade", "sort", "page"] as const;

function readParams(sp: Record<string, string | string[] | undefined>): Params {
  const out: Params = {};
  for (const k of KEYS) {
    const v = sp[k];
    const value = Array.isArray(v) ? v[0] : v;
    if (value) out[k] = value;
  }
  return out;
}

function href(current: Params, patch: Partial<Params>) {
  const next = { ...current, page: undefined, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/catalog?${s}` : "/catalog";
}

function heading(p: Params) {
  if (p.q) return `Поиск: «${p.q}»`;
  if (p.genre) return p.genre[0].toUpperCase() + p.genre.slice(1);
  if (p.country) return `Кино: ${p.country}`;
  if (p.source && p.source in SOURCE_LABELS) return `Источник: ${SOURCE_LABELS[p.source as SourceKind]}`;
  if (p.decade) return `Фильмы ${p.decade}-х`;
  return "Все фильмы";
}

export async function generateMetadata(props: PageProps<"/catalog">): Promise<Metadata> {
  return { title: heading(readParams(await props.searchParams)) };
}

export default async function Catalog(props: PageProps<"/catalog">) {
  const p = readParams(await props.searchParams);
  const sort: Sort = p.sort && p.sort in SORT_LABELS ? (p.sort as Sort) : "popular";
  const source = p.source && p.source in SOURCE_LABELS ? (p.source as SourceKind) : undefined;
  const page = Math.max(1, Number(p.page) || 1);

  const result = searchFilms({
    q: p.q,
    genre: p.genre,
    country: p.country,
    source,
    decade: Number(p.decade) || undefined,
    sort,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{heading(p)}</h1>
        <p className="text-sm text-neutral-500">Найдено: {result.total.toLocaleString("ru-RU")}</p>
      </div>

      <div className="space-y-3">
        <Filter label="Источник">
          <Chip href={href(p, { source: undefined })} active={!source}>Все</Chip>
          {(Object.keys(SOURCE_LABELS) as SourceKind[]).map((k) => (
            <Chip key={k} href={href(p, { source: k })} active={source === k}>{SOURCE_LABELS[k]}</Chip>
          ))}
        </Filter>
        <Filter label="Жанр">
          <Chip href={href(p, { genre: undefined })} active={!p.genre}>Все</Chip>
          {GENRES.map((g) => (
            <Chip key={g.name} href={href(p, { genre: g.name })} active={p.genre === g.name}>{g.name}</Chip>
          ))}
        </Filter>
        <Filter label="Страна">
          <Chip href={href(p, { country: undefined })} active={!p.country}>Все</Chip>
          {COUNTRIES.map((c) => (
            <Chip key={c.name} href={href(p, { country: c.name })} active={p.country === c.name}>{c.name}</Chip>
          ))}
        </Filter>
        <Filter label="Годы">
          <Chip href={href(p, { decade: undefined })} active={!p.decade}>Все</Chip>
          {DECADES.map((d) => (
            <Chip key={d} href={href(p, { decade: String(d) })} active={p.decade === String(d)}>{d}-е</Chip>
          ))}
        </Filter>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
          <Link
            key={s}
            href={href(p, { sort: s === "popular" ? undefined : s })}
            className={s === sort ? "text-amber-400" : "text-neutral-400 hover:text-white"}
          >
            {SORT_LABELS[s]}
          </Link>
        ))}
      </div>

      {result.films.length > 0 ? (
        <FilmGrid films={result.films} />
      ) : (
        <p className="py-16 text-center text-neutral-400">Ничего не нашлось. Попробуйте изменить запрос или фильтры.</p>
      )}

      {result.pages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4">
          {page > 1 && (
            <Link href={href(p, { page: String(page - 1) })} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-amber-400">
              ← Назад
            </Link>
          )}
          <span className="text-sm text-neutral-400">{page} из {result.pages}</span>
          {page < result.pages && (
            <Link href={href(p, { page: String(page + 1) })} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-amber-400">
              Вперёд →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 pt-1 text-sm text-neutral-500">{label}</span>
      <div className="-mr-4 flex gap-2 overflow-x-auto pb-1 pr-4">{children}</div>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition ${
        active ? "bg-amber-400 text-neutral-950" : "bg-white/5 text-neutral-300 hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
