import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "toolkit",
  description: "Salesforce development tools",
  icons: {
    icon: [
      {
        url: '/icon_128.ico',
        sizes: '128x128',
      },
      {
        url: '/icon_128.png',
        sizes: '128x128',
      }
    ],
    apple: {
      url: '/icon_128.png',
      sizes: '128x128',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
