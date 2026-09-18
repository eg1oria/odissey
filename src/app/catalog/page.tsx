import type { Metadata } from "next";
import Link from "next/link";
import MovieGrid from "@/components/MovieGrid";
import { GENRES, findGenre, searchMovies, type Sort } from "@/lib/archive";

const SORT_LABELS: Record<Sort, string> = {
  popular: "Популярные",
  newest: "Сначала новые",
  oldest: "Сначала старые",
  title: "По названию",
};

type Params = { q?: string; genre?: string; sort?: string; page?: string };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function readParams(sp: Record<string, string | string[] | undefined>): Params {
  return { q: one(sp.q), genre: one(sp.genre), sort: one(sp.sort), page: one(sp.page) };
}

function href(current: Params, patch: Partial<Params>) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/catalog?${s}` : "/catalog";
}

export async function generateMetadata(props: PageProps<"/catalog">): Promise<Metadata> {
  const p = readParams(await props.searchParams);
  if (p.q) return { title: `Поиск: ${p.q}` };
  return { title: findGenre(p.genre)?.label ?? "Каталог" };
}

export default async function Catalog(props: PageProps<"/catalog">) {
  const params = readParams(await props.searchParams);
  const sort: Sort = params.sort && params.sort in SORT_LABELS ? (params.sort as Sort) : "popular";
  const page = Math.max(1, Number(params.page) || 1);
  const genre = findGenre(params.genre);

  const result = await searchMovies({ query: params.q, genre: genre?.slug, sort, page });

  const heading = params.q ? `Поиск: «${params.q}»` : genre ? genre.label : "Все фильмы";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-sm text-neutral-500">
          Найдено: {result.total.toLocaleString("ru-RU")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip href={href(params, { genre: undefined, page: undefined })} active={!genre}>
          Все жанры
        </Chip>
        {GENRES.map((g) => (
          <Chip
            key={g.slug}
            href={href(params, { genre: g.slug, page: undefined })}
            active={genre?.slug === g.slug}
          >
            {g.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
          <Link
            key={s}
            href={href(params, { sort: s === "popular" ? undefined : s, page: undefined })}
            className={s === sort ? "text-amber-400" : "text-neutral-400 hover:text-white"}
          >
            {SORT_LABELS[s]}
          </Link>
        ))}
      </div>

      {result.error ? (
        <p className="py-16 text-center text-red-300">
          Не удалось связаться с Internet Archive. Попробуйте обновить страницу позже.
        </p>
      ) : result.movies.length > 0 ? (
        <MovieGrid movies={result.movies} />
      ) : (
        <p className="py-16 text-center text-neutral-400">
          Ничего не нашлось. Попробуйте другой запрос — названия в архиве на английском.
        </p>
      )}

      {result.pages > 1 && (
        <nav className="flex items-center justify-center gap-4 pt-4">
          {page > 1 && (
            <Link href={href(params, { page: String(page - 1) })} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-amber-400">
              ← Назад
            </Link>
          )}
          <span className="text-sm text-neutral-400">
            {page} из {result.pages}
          </span>
          {page < result.pages && (
            <Link href={href(params, { page: String(page + 1) })} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-amber-400">
              Вперёд →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm transition ${
        active ? "bg-amber-400 text-neutral-950" : "bg-white/5 text-neutral-300 hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
