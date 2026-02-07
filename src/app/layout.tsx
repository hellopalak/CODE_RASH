import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODE RASH",
  description: "A Retro Coding Contest Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="scanlines"></div>
        {children}
      </body>
    </html>
  );
}
