# Одиссея

Бесплатный онлайн-кинотеатр классических фильмов из общественного достояния.
Данные и видео берутся из коллекции [Internet Archive feature_films](https://archive.org/details/feature_films) —
API бесплатное, ключ не нужен, фильмы можно легально показывать.

## Запуск

```bash
npm install
npm run dev
```

## Деплой на Vercel

1. Запушить репозиторий на GitHub.
2. На vercel.com → **Add New… → Project** → выбрать репозиторий → **Deploy**. Настройки по умолчанию подходят.

## Структура

- `src/lib/archive.ts` — клиент API Internet Archive (поиск, метаданные, выбор видеофайла)
- `src/app/page.tsx` — главная с подборками по жанрам
- `src/app/catalog/page.tsx` — каталог: поиск, жанры, сортировка, пагинация
- `src/app/movie/[id]/page.tsx` — страница фильма с плеером
