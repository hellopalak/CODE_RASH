import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODE RASH",
  description: "A Retro Coding Contest Platform",
};

import { ContestProvider } from "@/context/ContestContext";
import StarBackground from "@/components/StarBackground";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ContestProvider>
          <StarBackground />
          <div className="scanlines"></div>
          {children}
        </ContestProvider>
      </body>
    </html>
  );
}
