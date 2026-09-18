import Link from "next/link";
import { SOURCE_LABELS, type FilmCard as Card } from "@/lib/catalog";

const BADGE: Record<string, string> = {
  commons: "bg-sky-500/80",
  youtube: "bg-red-600/80",
  archive: "bg-neutral-500/80",
};

export default function FilmCard({ film }: { film: Card }) {
  return (
    <Link href={`/film/${film.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        {film.poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- картинки отдают Wikimedia/YouTube, оптимизация Vercel не нужна
          <img
            src={film.poster}
            alt={film.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-neutral-400">
            {film.title}
          </div>
        )}
        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          {film.kinds.map((k) => (
            <span
              key={k}
              title={SOURCE_LABELS[k]}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${BADGE[k]}`}
            >
              {k === "commons" ? "WM" : k === "youtube" ? "YT" : "IA"}
            </span>
          ))}
        </div>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-amber-400">
        {film.title}
      </h3>
      {film.year && <p className="text-xs text-neutral-500">{film.year}</p>}
    </Link>
  );
}
