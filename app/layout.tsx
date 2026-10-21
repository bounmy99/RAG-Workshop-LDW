import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Lao } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansLao = Noto_Sans_Lao({
  variable: "--font-noto-lao",
  subsets: ["lao"],
});

export const metadata: Metadata = {
  title: "RAG Workshop Playground",
  description: "ໜ້າແຊັດສຳລັບທົດລອງແຕ່ລະຫົວຂໍ້ຂອງ workshop RAG ເບື້ອງຕົ້ນ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lo"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansLao.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
