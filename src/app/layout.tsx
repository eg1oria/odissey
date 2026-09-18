import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: { default: "Одиссея — классическое кино бесплатно", template: "%s — Одиссея" },
  description:
    "Бесплатный онлайн-кинотеатр классических фильмов из общественного достояния. Источник — Internet Archive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-neutral-950 text-neutral-100">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-neutral-500">
          Все фильмы находятся в общественном достоянии и предоставляются{" "}
          <a href="https://archive.org/details/feature_films" className="underline hover:text-neutral-300">
            Internet Archive
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
