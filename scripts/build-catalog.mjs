// Собирает каталог фильмов из Wikidata в src/data/catalog.json.
// Берём только фильмы, у которых есть легальный источник видео:
//   P10   — видеофайл на Wikimedia Commons (общественное достояние / свободная лицензия)
//   P1651 — официально загруженный фильм на YouTube
//   P724  — запись в Internet Archive
// Запуск: npm run catalog

import { writeFile, mkdir } from "node:fs/promises";

const ENDPOINT = "https://query.wikidata.org/sparql";
const UA = "OdisseyCatalogBot/0.1 (https://github.com/Eglor/odissey)";
const BATCH = 400;

const FILM_TYPES = [
  "wd:Q11424", // фильм
  "wd:Q202866", // анимационный фильм
  "wd:Q29168811", // полнометражный мультфильм
  "wd:Q506240", // телефильм
  "wd:Q93204", // документальный фильм
  "wd:Q24862", // короткометражный фильм
];

const TRAILER = "wd:Q622550";

async function sparql(query, attempt = 1) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Accept: "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ query }),
  });
  // При таймауте Wikidata может вернуть 200 с оборванным JSON — это тоже повод повторить.
  const text = await res.text();
  let data;
  try {
    if (res.ok) data = JSON.parse(text);
  } catch {}
  if (!data) {
    if (attempt < 6) {
      const wait = res.status === 429 ? 60_000 : 10_000 * attempt;
      console.warn(`  SPARQL ${res.status}${res.ok ? " (оборванный ответ)" : ""}, повтор через ${wait / 1000}с`);
      await new Promise((r) => setTimeout(r, wait));
      return sparql(query, attempt + 1);
    }
    throw new Error(`SPARQL ${res.status}: ${text.slice(0, 300)}`);
  }
  return data.results.bindings.map((b) =>
    Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])),
  );
}

const qid = (uri) => uri.slice(uri.lastIndexOf("/") + 1);
const commonsFile = (uri) =>
  decodeURIComponent(uri.slice(uri.lastIndexOf("/") + 1)).replace(/_/g, " ");

async function sourceIds(prop) {
  const rows = [];
  for (const type of FILM_TYPES) {
    rows.push(
      ...(await sparql(`
        SELECT ?film ?v WHERE {
          ?film p:${prop} ?st.
          ?st ps:${prop} ?v.
          ?film wdt:P31 ${type}.
          FILTER NOT EXISTS { ?st pq:P3831 ${TRAILER} }
        }`)),
    );
  }
  console.log(`  ${prop}: ${rows.length}`);
  return rows;
}

const films = new Map();
function film(id) {
  if (!films.has(id)) films.set(id, { id, commons: [], youtube: [], archive: [] });
  return films.get(id);
}

function add(list, value, max = 3) {
  if (!list.includes(value) && list.length < max) list.push(value);
}

console.log("1/4 Источники видео…");
for (const row of await sourceIds("P10")) {
  const file = commonsFile(row.v);
  // Трейлеры и отрывки без квалификатора отсекаем по имени файла.
  if (/trailer|трейлер|teaser|clip|excerpt|отрывок/i.test(file)) continue;
  add(film(qid(row.film)).commons, file);
}
for (const row of await sourceIds("P1651")) add(film(qid(row.film)).youtube, row.v);
for (const row of await sourceIds("P724")) add(film(qid(row.film)).archive, row.v);
console.log(`  фильмов с видео: ${films.size}`);

const ids = [...films.keys()];
const batches = [];
for (let i = 0; i < ids.length; i += BATCH) batches.push(ids.slice(i, i + BATCH));

console.log(`2/4 Названия, годы, постеры (${batches.length} пачек)…`);
for (const [i, batch] of batches.entries()) {
  const values = batch.map((id) => `wd:${id}`).join(" ");
  const rows = await sparql(`
    SELECT ?film ?ru ?en ?desc ?date ?dur ?poster ?image ?wiki WHERE {
      VALUES ?film { ${values} }
      OPTIONAL { ?film rdfs:label ?ru FILTER(LANG(?ru) = "ru") }
      OPTIONAL { ?film rdfs:label ?en FILTER(LANG(?en) = "en") }
      OPTIONAL { ?film schema:description ?desc FILTER(LANG(?desc) = "ru") }
      OPTIONAL { ?film wdt:P577 ?date }
      OPTIONAL { ?film wdt:P2047 ?dur }
      OPTIONAL { ?film wdt:P3383 ?poster }
      OPTIONAL { ?film wdt:P18 ?image }
      OPTIONAL { ?wiki schema:about ?film; schema:isPartOf <https://ru.wikipedia.org/> }
    }`);
  for (const r of rows) {
    const f = film(qid(r.film));
    f.title ??= r.ru;
    f.original ??= r.en;
    f.desc ??= r.desc;
    const year = r.date ? Number(r.date.slice(0, r.date.startsWith("-") ? 5 : 4)) : undefined;
    if (year && (!f.year || year < f.year)) f.year = year;
    if (r.dur && !f.duration) f.duration = Math.round(Number(r.dur));
    f.poster ??= r.poster ? commonsFile(r.poster) : r.image ? commonsFile(r.image) : undefined;
    if (r.wiki) f.wiki ??= decodeURIComponent(r.wiki.split("/wiki/")[1]);
  }
  process.stdout.write(`  ${i + 1}/${batches.length}\r`);
}

console.log(`\n3/4 Жанры, страны, режиссёры…`);
for (const [i, batch] of batches.entries()) {
  const values = batch.map((id) => `wd:${id}`).join(" ");
  const rows = await sparql(`
    SELECT ?film ?prop ?item ?label WHERE {
      VALUES ?film { ${values} }
      {
        ?film wdt:P136 ?item. BIND("genre" AS ?prop)
      } UNION {
        ?film wdt:P495 ?item. BIND("country" AS ?prop)
      } UNION {
        ?film wdt:P57 ?item. BIND("director" AS ?prop)
      }
      OPTIONAL { ?item rdfs:label ?ru FILTER(LANG(?ru) = "ru") }
      OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
      BIND(COALESCE(?ru, ?en) AS ?label)
      FILTER(BOUND(?label))
    }`);
  for (const r of rows) {
    const f = film(qid(r.film));
    const key = r.prop + "s";
    f[key] ??= [];
    add(f[key], r.label, 4);
  }
  process.stdout.write(`  ${i + 1}/${batches.length}\r`);
}

console.log(`\n4/4 Сохранение…`);
const catalog = [...films.values()]
  .filter((f) => f.title || f.original)
  .filter((f) => f.commons.length || f.youtube.length || f.archive.length)
  .map((f) => {
    const title = f.title ?? f.original;
    const out = {
      id: f.id,
      t: title,
      o: f.original && f.original !== title ? f.original : undefined,
      y: f.year,
      d: f.desc,
      m: f.duration,
      p: f.poster,
      w: f.wiki,
      g: f.genres,
      c: f.countrys,
      r: f.directors,
      sc: f.commons.length ? f.commons : undefined,
      sy: f.youtube.length ? f.youtube : undefined,
      sa: f.archive.length ? f.archive : undefined,
    };
    // Убираем пустые поля, чтобы файл был меньше.
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
  })
  .sort((a, b) => a.t.localeCompare(b.t, "ru"));

await mkdir("src/data", { recursive: true });
await writeFile("src/data/catalog.json", JSON.stringify(catalog));
console.log(`Готово: ${catalog.length} фильмов → src/data/catalog.json`);
