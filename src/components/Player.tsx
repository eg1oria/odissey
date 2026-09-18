"use client";

import { useState } from "react";
import type { Source } from "@/lib/catalog";

export default function Player({ sources, title, poster }: { sources: Source[]; title: string; poster?: string }) {
  const [active, setActive] = useState(0);
  const source = sources[active];

  if (!source) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-neutral-900 text-neutral-400">
        Видео для этого фильма пока нет.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-black">
        {source.player === "video" ? (
          <video
            key={source.url}
            src={source.url}
            poster={poster}
            controls
            preload="metadata"
            className="aspect-video w-full bg-black"
          >
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        ) : (
          <iframe
            key={source.url}
            src={source.url}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-400">Источник:</span>
        {sources.map((s, i) => (
          <button
            key={s.url}
            onClick={() => setActive(i)}
            className={`rounded-full px-3 py-1 transition ${
              i === active ? "bg-amber-400 text-neutral-950" : "bg-white/5 text-neutral-300 hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
        <a
          href={source.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-neutral-400 hover:text-amber-400"
        >
          Открыть на сайте источника ↗
        </a>
      </div>
      {sources.length > 1 && (
        <p className="text-xs text-neutral-500">
          Если видео не запускается, переключите источник — какой-то из сервисов может быть недоступен в вашей сети.
        </p>
      )}
    </div>
  );
}
