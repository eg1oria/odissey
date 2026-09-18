import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FilmRow from "@/components/FilmRow";
import Player from "@/components/Player";
import { getFilm, getWikiSummary, searchFilms } from "@/lib/catalog";

export async function generateMetadata(props: PageProps<"/film/[id]">): Promise<Metadata> {
  const film = getFilm((await props.params).id);
  if (!film) return { title: "Фильм не найден" };
  return {
    title: film.year ? `${film.title} (${film.year})` : film.title,
    description: film.description,
    openGraph: film.poster ? { images: [film.poster] } : undefined,
  };
}

export default async function FilmPage(props: PageProps<"/film/[id]">) {
  const film = getFilm((await props.params).id);
  if (!film) notFound();

  const summary = film.wiki ? await getWikiSummary(film.wiki) : null;
  const genre = film.genres[0];
  const similar = genre ? searchFilms({ genre, exclude: film.id, perPage: 18 }).films : [];

  const facts = [
    film.directors.length > 0 && ["Режиссёр", film.directors.join(", ")],
    film.countries.length > 0 && ["Страна", film.countries.join(", ")],
    film.duration && ["Длительность", `${film.duration} мин`],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-10">
      <Player sources={film.sources} title={film.title} poster={film.poster} />

      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        {film.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={film.poster} alt={film.title} className="hidden w-full rounded-lg md:block" />
        )}
        <div className="space-y-4 md:col-start-2">
          <div>
            <h1 className="text-3xl font-bold">
              {film.title}
              {film.year && <span className="ml-2 font-normal text-neutral-500">({film.year})</span>}
            </h1>
            {film.original && <p className="text-neutral-400">{film.original}</p>}
          </div>
          {facts.length > 0 && (
            <dl className="grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
              {facts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-neutral-500">{k}</dt>
                  <dd className="text-neutral-200">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {film.genres.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {film.genres.map((g) => (
                <li key={g}>
                  <Link
                    href={`/catalog?genre=${encodeURIComponent(g)}`}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300 hover:bg-white/10"
                  >
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {(summary ?? film.description) && (
            <p className="max-w-3xl leading-relaxed text-neutral-300">{summary ?? film.description}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2 text-sm">
            {film.wiki && (
              <a
                href={`https://ru.wikipedia.org/wiki/${encodeURIComponent(film.wiki)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/15 px-4 py-2 hover:border-amber-400"
              >
                Статья в Википедии ↗
              </a>
            )}
            <a
              href={`https://www.wikidata.org/wiki/${film.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-4 py-2 hover:border-amber-400"
            >
              Wikidata ↗
            </a>
          </div>
        </div>
      </div>

      {genre && <FilmRow title="Похожие фильмы" href={`/catalog?genre=${encodeURIComponent(genre)}`} films={similar} />}
    </div>
  );
}
