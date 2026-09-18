import Link from "next/link";
import FilmCard from "./FilmCard";
import type { FilmCard as Card } from "@/lib/catalog";

export default function FilmRow({ title, href, films }: { title: string; href: string; films: Card[] }) {
  if (films.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-neutral-400 hover:text-amber-400">
          Все →
        </Link>
      </div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {films.map((f) => (
          <div key={f.id} className="w-32 shrink-0 snap-start sm:w-40">
            <FilmCard film={f} />
          </div>
        ))}
      </div>
    </section>
  );
}
