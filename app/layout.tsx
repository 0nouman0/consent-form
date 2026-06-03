import type { Metadata } from "next";
import { DM_Sans, Crimson_Pro } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
});

export const metadata: Metadata = {
  title: "ConsentGen — Medical Consent Form Generator",
  description:
    "AI-powered medico-legal consent form generator for Indian doctors. IMC 2002 compliant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${crimsonPro.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}