import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import WhatsAppWidget from "./components/WhatsAppWidget";
import "./globals.css";

// Poppins is a non-variable Google Font, so weights are listed explicitly.
// Self-hosted by next/font — no external request to Google at runtime.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FOKUS — Sewa Kamera, Studio & Jasa Fotografi Profesional",
  description:
    "Fokus menyediakan layanan sewa kamera profesional, studio foto modern, dan jasa fotografi berkualitas tinggi. Wujudkan momen terbaik Anda bersama kami.",
  keywords: "sewa kamera, studio foto, jasa foto, fotografi profesional, rental kamera, photography service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} antialiased`}
    >
      <body className="min-h-screen">
        <AuthProvider>
          <AppDataProvider>
            {children}
            <WhatsAppWidget />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
