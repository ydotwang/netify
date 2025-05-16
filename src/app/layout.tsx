import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SpotifyProvider } from "@/contexts/SpotifyContext";
import SocialLinks from '@/components/SocialLinks';

const interSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetEase to Spotify Transfer",
  description: "Transfer your NetEase Cloud Music albums to Spotify playlists",
  icons: { icon: "/netify_icon.svg" },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${interSans.variable} ${jetMono.variable} antialiased text-gray-900`}>
        <SpotifyProvider>
          {children}
        </SpotifyProvider>
        <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2 z-50">
          <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500 select-none">
            OliverMade
          </h2>
          <SocialLinks />
        </div>
      </body>
    </html>
  );
}