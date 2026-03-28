import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
});

export const metadata: Metadata = {
  title: "Pitch Tank India",
  description: "Pitch your startup to Ashneer Grover — AI-powered Shark Tank India simulator",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Pitch Tank India",
    description: "Pitch your startup to Ashneer Grover — AI-powered Shark Tank India simulator",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
