// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import DecorativeElements from "@/app/components/ui/DecorativeElements";

export const metadata: Metadata = {
  title: "퀴즈퀴즈!",
  description: "당신의 하루를 특별하게 시작하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">

        {/* 전역 헤더 */}
        {/* <Header /> */}
        <DecorativeElements zIndex={1} />

        {/* 페이지 콘텐츠 */}
        <main className="flex-1">
          {children}
        </main>

        {/* 전역 푸터 */}
        {/* <footer className="py-6 text-center text-xs text-gray-500">
          © 2025 Fortune App. All rights reserved.
        </footer> */}
      </body>
    </html>
  );
}