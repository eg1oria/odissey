import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MovieRow from "@/components/MovieRow";
import { GENRES, archivePageUrl, getMovie, posterUrl, searchMovies } from "@/lib/archive";

export const revalidate = 21600;

export async function generateMetadata(props: PageProps<"/movie/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const movie = await getMovie(decodeURIComponent(id));
  if (!movie) return { title: "Фильм не найден" };
  return {
    title: movie.year ? `${movie.title} (${movie.year})` : movie.title,
    description: movie.description.slice(0, 200),
    openGraph: { images: [posterUrl(movie.id)] },
  };
}

export default async function MoviePage(props: PageProps<"/movie/[id]">) {
  const { id } = await props.params;
  const movie = await getMovie(decodeURIComponent(id));
  if (!movie) notFound();

  const subjects = movie.subjects.join(" ").toLowerCase();
  const genre = GENRES.find((g) =>
    g.query
      .replace(/"/g, "")
      .split(" OR ")
      .some((word) => subjects.includes(word)),
  );
  const similar = genre
    ? (await searchMovies({ genre: genre.slug, rows: 19 })).movies.filter((m) => m.id !== movie.id).slice(0, 18)
    : [];

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-xl bg-black">
        {movie.videos.length > 0 ? (
          <video
            controls
            preload="metadata"
            poster={posterUrl(movie.id)}
            className="aspect-video w-full bg-black"
          >
            {movie.videos.map((v) => (
              <source key={v.url} src={v.url} type={v.type} />
            ))}
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        ) : (
          <iframe
            src={`https://archive.org/embed/${encodeURIComponent(movie.id)}`}
            title={movie.title}
            allowFullScreen
            className="aspect-video w-full"
          />
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl(movie.id)}
          alt={movie.title}
          className="hidden w-full rounded-lg md:block"
        />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            {movie.title}
            {movie.year && <span className="ml-2 font-normal text-neutral-500">({movie.year})</span>}
          </h1>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-400">
            {movie.creator && (
              <div>
                <dt className="inline">Автор: </dt>
                <dd className="inline text-neutral-200">{movie.creator}</dd>
              </div>
            )}
            {movie.runtime && (
              <div>
                <dt className="inline">Длительность: </dt>
                <dd className="inline text-neutral-200">{movie.runtime}</dd>
              </div>
            )}
            {movie.downloads != null && (
              <div>
                <dt className="inline">Просмотров: </dt>
                <dd className="inline text-neutral-200">{movie.downloads.toLocaleString("ru-RU")}</dd>
              </div>
            )}
          </dl>
          {movie.subjects.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {movie.subjects.map((s) => (
                <li key={s} className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300">
                  {s}
                </li>
              ))}
            </ul>
          )}
          {movie.description && (
            <p className="max-w-3xl whitespace-pre-line leading-relaxed text-neutral-300">
              {movie.description}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2 text-sm">
            {movie.videos[0] && (
              <a href={movie.videos[0].url} download className="rounded-full border border-white/15 px-4 py-2 hover:border-amber-400">
                Скачать
              </a>
            )}
            <a href={archivePageUrl(movie.id)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 hover:border-amber-400">
              Страница на archive.org ↗
            </a>
          </div>
        </div>
      </div>

      {genre && (
        <MovieRow title={`Похожие: ${genre.label.toLowerCase()}`} href={`/catalog?genre=${genre.slug}`} movies={similar} />
      )}
    </div>
  );
}
