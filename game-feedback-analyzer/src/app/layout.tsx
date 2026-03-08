import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Feedback Analyzer",
  description: "게임 피드백 분석 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg font-body text-text-mid antialiased">
        {children}
      </body>
    </html>
  );
}
