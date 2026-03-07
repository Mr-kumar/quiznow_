import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils"; // shadcn utility
import { QueryProvider } from "../providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuizNow | Master Your Exams",
  description: "The professional platform for exam preparation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground",
          inter.className,
        )}
      >
        <QueryProvider>
          {/* We will add a Toaster here later for notifications */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
