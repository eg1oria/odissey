import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/archive";

export default function MovieGrid({ movies }: { movies: MovieSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {movies.map((m) => (
        <MovieCard key={m.id} movie={m} />
      ))}
    </div>
  );
}
