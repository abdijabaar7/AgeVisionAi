import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgeVision AI — Qiyaasta da'da muuqaalka",
  description: "Qiyaas muuqaalka da'da wejiga adigoo adeegsanaya AI. Somali and English apparent-age estimation.",
  openGraph: { title: "AgeVision AI", description: "AI-powered apparent age estimation", type: "website" },
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#f5f8fa" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="so"><body>{children}</body></html>;
}
