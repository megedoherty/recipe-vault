import './variables.css';
import './globals.css';

import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import { ReactNode } from 'react';

import Navbar from '@/components/Navbar/Navbar.component';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Recipe Vault',
  description: 'A recipe vault for our recipes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body>
        <header>
          <Navbar />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
