import Link from "next/link";
import FilmRow from "@/components/FilmRow";
import { COUNTRIES, GENRES, TOTAL, searchFilms } from "@/lib/catalog";

export default function Home() {
  const popular = searchFilms({ perPage: 18 });
  const rows = [
    { title: "Смотреть на Wikimedia", href: "/catalog?source=commons", films: searchFilms({ source: "commons", perPage: 18 }).films },
    { title: "Официально на YouTube", href: "/catalog?source=youtube", films: searchFilms({ source: "youtube", perPage: 18 }).films },
    { title: "Из Internet Archive", href: "/catalog?source=archive", films: searchFilms({ source: "archive", perPage: 18 }).films },
    ...GENRES.slice(0, 6).map((g) => ({
      title: g.name[0].toUpperCase() + g.name.slice(1),
      href: `/catalog?genre=${encodeURIComponent(g.name)}`,
      films: searchFilms({ genre: g.name, perPage: 18 }).films,
    })),
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 p-8 sm:p-12">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          {TOTAL.toLocaleString("ru-RU")} фильмов — бесплатно и легально
        </h1>
        <p className="mt-4 max-w-xl text-neutral-300">
          Собираем кино из открытых источников: Wikimedia Commons, официальные каналы киностудий на
          YouTube и Internet Archive. Если один источник не работает — переключитесь на другой.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/catalog" className="rounded-full bg-amber-400 px-6 py-2.5 font-semibold text-neutral-950 hover:bg-amber-300">
            Открыть каталог
          </Link>
          {COUNTRIES.slice(0, 4).map((c) => (
            <Link
              key={c.name}
              href={`/catalog?country=${encodeURIComponent(c.name)}`}
              className="rounded-full border border-white/15 px-4 py-2.5 text-sm hover:border-amber-400"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <FilmRow title="Популярное" href="/catalog" films={popular.films} />
      {rows.map((r) => (
        <FilmRow key={r.href} {...r} />
      ))}
    </div>
  );
}
