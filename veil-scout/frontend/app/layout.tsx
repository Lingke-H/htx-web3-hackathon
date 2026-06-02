import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veil Scout Demo | HTX Web3 Hackathon",
  description:
    "Judge-ready demo UI for Veil Scout: wallet state, AI conviction, milestone markets, and risk controls in one screen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          <Providers>{children}</Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
