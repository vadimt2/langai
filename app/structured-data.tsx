export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LangAI',
    alternateName: 'AI Translation App',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Translate text and voice between languages using AI. Fast, accurate translations powered by advanced AI models.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '100',
      bestRating: '5',
      worstRating: '1',
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Language Learners, Travelers, International Business',
    },
    creator: {
      '@type': 'Organization',
      name: 'Your Company Name',
      url: process.env.NEXT_PUBLIC_SITE_URL,
      logo: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
    },
    keywords:
      'translation, AI translation, voice translation, language translation, multilingual, LangAI',
    url: process.env.NEXT_PUBLIC_SITE_URL,
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
