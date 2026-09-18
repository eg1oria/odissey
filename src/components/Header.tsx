import Link from "next/link";
import { GENRES } from "@/lib/archive";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-amber-400">Одис</span>сея
        </Link>
        <nav className="hidden gap-4 text-sm text-neutral-300 md:flex">
          <Link href="/catalog" className="hover:text-white">Каталог</Link>
          {GENRES.slice(0, 5).map((g) => (
            <Link key={g.slug} href={`/catalog?genre=${g.slug}`} className="hover:text-white">
              {g.label}
            </Link>
          ))}
        </nav>
        <form action="/catalog" className="ml-auto w-full sm:w-72">
          <input
            type="search"
            name="q"
            placeholder="Поиск фильмов (на английском)…"
            className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-amber-400"
          />
        </form>
      </div>
    </header>
  );
}
