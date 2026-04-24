import type { Metadata } from "next";
import "./globals.css";
import { AuthLayout } from "@/components/auth-layout";

export const metadata: Metadata = {
  title: "Logistics ERP System",
  description: "Complete enterprise logistics management system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}
