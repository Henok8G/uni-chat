import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { ThemeManager } from "@/components/ThemeManager";
import { DarkModeScript } from "@/components/DarkModeScript";
import { DEFAULT_THEME_COLOR } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sfProMedium = localFont({
  src: "../../public/fonts/SF-Pro-Text-Medium.otf",
  variable: "--font-sf-pro-medium",
  weight: "500",
});

export const metadata: Metadata = {
  title: "Ethi-Uni-Chat · Exclusive Ethiopian University Student Network",
  description: "The exclusive, verified video chat and campus community for Ethiopian University students.",
  icons: {
    icon: [
      { url: "/images/logo-icon.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/images/logo-icon.png",
    apple: [
      { url: "/images/logo-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const themeColor = user?.themeColor ?? DEFAULT_THEME_COLOR;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sfProMedium.variable} antialiased`}
      >
        {/* Restores dark mode class synchronously before first paint */}
        <DarkModeScript />
        {/* Inject the user's personal accent color as a CSS variable on :root */}
        <ThemeManager color={themeColor} />
        {children}
      </body>
    </html>
  );
}
