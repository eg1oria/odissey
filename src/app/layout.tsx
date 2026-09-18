import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: { default: "Одиссея — кино бесплатно", template: "%s — Одиссея" },
  description:
    "Бесплатный онлайн-кинотеатр: фильмы из открытых источников — Wikimedia Commons, YouTube и Internet Archive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-neutral-950 text-neutral-100">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-neutral-500">
          Каталог собран по данным{" "}
          <a href="https://www.wikidata.org" className="underline hover:text-neutral-300">Wikidata</a>. Видео
          воспроизводится с сайтов-источников: Wikimedia Commons, YouTube и Internet Archive.
        </footer>
      </body>
    </html>
  );
}
