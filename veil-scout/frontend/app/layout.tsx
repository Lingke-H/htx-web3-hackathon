import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veil Scout Mission Control | HTX Web3 Hackathon",
  description:
    "Judge-ready mission control UI for Veil Scout: AI-assisted scout discovery, credit markets, oracle settlement, and manual risk rails in one screen.",
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
