import FilmCard from "./FilmCard";
import type { FilmCard as Card } from "@/lib/catalog";

export default function FilmGrid({ films }: { films: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {films.map((f) => (
        <FilmCard key={f.id} film={f} />
      ))}
    </div>
  );
}
