import Link from "next/link";
import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/archive";

export default function MovieRow({
  title,
  href,
  movies,
}: {
  title: string;
  href: string;
  movies: MovieSummary[];
}) {
  if (movies.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-neutral-400 hover:text-amber-400">
          Все →
        </Link>
      </div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {movies.map((m) => (
          <div key={m.id} className="w-32 shrink-0 snap-start sm:w-40">
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
