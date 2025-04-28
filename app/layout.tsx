import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { RecaptchaProvider } from '@/context/recaptcha-context';
import { GoogleAnalytics } from '@next/third-parties/google';
import StructuredData from './structured-data';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LangAI - AI Translation App',
  description:
    'Translate text and voice between languages using AI. Fast, accurate translations powered by advanced AI models.',
  generator: 'v0.dev',
  keywords: [
    'translation',
    'AI translation',
    'voice translation',
    'language translation',
    'multilingual',
    'LangAI',
  ],
  authors: [{ name: 'Your Name', url: 'https://langai.live' }],
  creator: 'Your Company Name',
  publisher: 'Your Company Name',
  applicationName: 'LangAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: 'LangAI - AI Translation App',
    description:
      'Translate text and voice between languages using AI. Fast, accurate translations powered by advanced AI models.',
    siteName: 'LangAI',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'LangAI - AI Translation App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LangAI - AI Translation App',
    description:
      'Translate text and voice between languages using AI. Fast, accurate translations powered by advanced AI models.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/twitter-image.jpg`],
    creator: '@yourtwitterhandle',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,
    // Add language alternates if you have them
    // languages: {
    //   'en-US': 'https://your-domain.com/en',
    //   'es-ES': 'https://your-domain.com/es',
    // },
  },
  verification: {
    google: 'your-google-site-verification',
    // yandex: 'your-yandex-verification',
    // bing: 'your-bing-verification',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          storageKey='translation-app-theme'
        >
          <RecaptchaProvider>
            {children}
            <Toaster />
          </RecaptchaProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
