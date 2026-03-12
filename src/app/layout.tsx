import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tweet Analyzer",
  description: "AI-powered tweet analysis and MDX article generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gh-bg text-gh-text min-h-screen antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 px-4 py-8 pb-20 md:px-8 md:pb-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
