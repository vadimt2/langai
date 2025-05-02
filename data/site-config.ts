// Website configuration

export interface FooterLink {
  title: string;
  url: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

// Footer navigation
export const footerLinks: FooterSection[] = [
  {
    title: 'Quick Links',
    links: [
      {
        title: 'Home',
        url: '/',
      },
      {
        title: 'Text Translation',
        url: '/?tab=text',
      },
      {
        title: 'Image Translation',
        url: '/?tab=image',
      },
    ],
  },
  {
    title: 'Legal',
    links: [
      {
        title: 'Privacy Policy',
        url: '/privacy',
      },
      {
        title: 'Terms & Conditions',
        url: '/terms',
      },
      {
        title: 'Cookie Policy',
        url: '/cookies',
      },
    ],
  },
  {
    title: 'Company',
    links: [
      {
        title: 'About Us',
        url: '/about',
      },
      {
        title: 'Contact',
        url: '/contact',
      },
      // {
      //   title: 'Blog',
      //   url: '/blog',
      // },
    ],
  },
];

// SEO metadata
export const seoConfig = {
  title: 'LangAI - AI Translation App',
  description:
    'Translate text, images, and documents between languages using AI. Fast, accurate translations powered by advanced AI models.',
  keywords: [
    'translation',
    'AI translation',
    'voice translation',
    'language translation',
    'image translation',
    'document translation',
    'multilingual',
    'LangAI',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://langai.live',
    siteName: 'LangAI',
  },
  twitter: {
    handle: '@langai',
    site: '@langai',
    cardType: 'summary_large_image',
  },
};
