import Link from "next/link";
import { posterUrl, type MovieSummary } from "@/lib/archive";

export default function MovieCard({ movie }: { movie: MovieSummary }) {
  return (
    <Link href={`/movie/${encodeURIComponent(movie.id)}`} className="group block">
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element -- постеры отдаёт archive.org, оптимизация Vercel не нужна */}
        <img
          src={posterUrl(movie.id)}
          alt={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-amber-400">
        {movie.title}
      </h3>
      {movie.year && <p className="text-xs text-neutral-500">{movie.year}</p>}
    </Link>
  );
}
