import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logistics ERP System",
  description: "Complete enterprise logistics management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
