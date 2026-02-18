import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://vynr.app"),
  title: "Vynr",
  description: "A quiet atlas for wine.",
  openGraph: {
    title: "Vynr",
    description: "A quiet atlas for wine.",
    url: "https://vynr.app",
    siteName: "Vynr",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vynr" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynr",
    description: "A quiet atlas for wine.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
