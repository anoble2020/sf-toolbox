import { Manrope } from 'next/font/google';
import type { Metadata } from "next";
import Layout from '@/components/Layout';
import "./globals.css";

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

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
    <html lang="en">
      <body className={manrope.variable}>
        {children}
      </body>
    </html>
  );
}
