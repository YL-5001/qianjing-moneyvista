import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "钱景｜攀登财富之巅",
  description: "清晰掌控储蓄进度、投资收益与财富目标。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
