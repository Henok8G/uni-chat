import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { ThemeManager } from "@/components/ThemeManager";
import { DEFAULT_THEME_COLOR } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ethi-Uni-Chat",
  description: "The exclusive video chat for verified Ethiopian University students.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const themeColor = user?.themeColor ?? DEFAULT_THEME_COLOR;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Inject the user's personal accent color as a CSS variable on :root */}
        <ThemeManager color={themeColor} />
        {children}
      </body>
    </html>
  );
}
