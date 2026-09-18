import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold">Страница не найдена</h1>
      <p className="mt-2 text-neutral-400">Возможно, фильм был удалён из архива.</p>
      <Link href="/" className="mt-6 inline-block text-amber-400 hover:underline">
        На главную
      </Link>
    </div>
  );
}
