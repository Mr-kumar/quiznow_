import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils"; // shadcn utility

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
        {/* We will add a Toaster here later for notifications */}
        {children}
      </body>
    </html>
  );
}
