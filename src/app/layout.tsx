import "@/app/globals.css";
import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import type { ReactNode } from "react";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-fira-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoboMission Inspo",
  description: "Research library for embedded YouTube references and structured notes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background-cream antialiased selection:bg-secondary-container">
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className={`${firaSans.variable} min-h-screen bg-background-cream font-body text-text-charcoal`}>
        {children}
      </body>
    </html>
  );
}
