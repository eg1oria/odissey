import Link from "next/link";
import MovieRow from "@/components/MovieRow";
import { GENRES, searchMovies } from "@/lib/archive";

// Рендерим по запросу: ответы archive.org кешируются на уровне fetch,
// а пустая страница из-за сбоя при сборке не застрянет в кеше.
export const dynamic = "force-dynamic";

const HOME_GENRES = ["horror", "sci-fi", "noir", "comedy", "western", "animation"];

export default async function Home() {
  const [popular, ...byGenre] = await Promise.all([
    searchMovies({ rows: 18 }),
    ...HOME_GENRES.map((slug) => searchMovies({ genre: slug, rows: 18 })),
  ]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 p-8 sm:p-12">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Классика кино — бесплатно и без регистрации
        </h1>
        <p className="mt-4 max-w-xl text-neutral-300">
          Тысячи фильмов из общественного достояния: нуар, хорроры, вестерны, фантастика и немое
          кино. Смотрите прямо в браузере.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-2.5 font-semibold text-neutral-950 hover:bg-amber-300"
        >
          Открыть каталог
        </Link>
      </section>

      {popular.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Не удалось загрузить фильмы из Internet Archive. Попробуйте обновить страницу позже.
        </p>
      )}

      <MovieRow title="Популярное" href="/catalog" movies={popular.movies} />
      {HOME_GENRES.map((slug, i) => {
        const genre = GENRES.find((g) => g.slug === slug)!;
        return (
          <MovieRow
            key={slug}
            title={genre.label}
            href={`/catalog?genre=${slug}`}
            movies={byGenre[i].movies}
          />
        );
      })}
    </div>
  );
}
