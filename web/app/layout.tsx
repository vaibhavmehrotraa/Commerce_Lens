import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommerceLens | E-commerce Purchase, Customer Value & Probability Intelligence",
  description:
    "A portfolio analytics product built on 60,000 synthetic e-commerce sessions: descriptive statistics, association, conditional probability, Bayes' theorem, random variables, and distribution modeling applied to real business questions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <SiteNav />
          <main className="flex-1">
            <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">{children}</div>
          </main>
          <SiteFooter />
        </TooltipProvider>
      </body>
    </html>
  );
}
