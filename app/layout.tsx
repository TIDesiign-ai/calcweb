import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "履修ナビ — 時間割と先輩の口コミ",
  description:
    "時間割を組みながら、先輩たちの授業レビューを確認できる履修登録支援サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
