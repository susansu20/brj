import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRJ Social Repurposing Portal",
  description: "Repurpose articles into Instagram, Facebook, and LinkedIn posts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
