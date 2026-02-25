import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "./providers/query-provider";

export const metadata: Metadata = {
  title: "Pharm Talk",
  description: "모바일 퍼스트 헬스케어 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <QueryProvider>
          <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl px-4">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
