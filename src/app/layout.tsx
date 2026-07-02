import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotruck — Marketplace Foodtruck & Événements",
  description:
    "Connectez votre foodtruck aux meilleurs événements en France. La marketplace SaaS qui simplifie la mise en relation entre foodtruckers et organisateurs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
