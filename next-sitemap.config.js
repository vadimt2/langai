/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://langai.live',
  generateRobotsTxt: true,

  // More specific exclusion patterns
  exclude: ['/api/*', '/404', '/500', '/_*'],

  // Transform each URL entry to include more metadata
  transform: async (config, path) => {
    // Home page gets highest priority
    const priority = path === '/' ? 1.0 : 0.8;

    // Set change frequency based on path
    let changefreq = 'monthly';
    if (path === '/') {
      changefreq = 'daily';
    } else if (path.startsWith('/blog/')) {
      changefreq = 'weekly';
    }

    // Return transformed entry
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      // Add alternate language versions if you have them
      // alternateRefs: [
      //   { href: `${config.siteUrl}/es${path}`, hreflang: 'es' },
      //   { href: `${config.siteUrl}/de${path}`, hreflang: 'de' },
      // ],
    };
  },

  additionalPaths: async (config) => {
    // Explicitly add critical paths
    return [
      // Home page
      {
        loc: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      },
      // Add any other important static pages here
      // { loc: '/about', changefreq: 'monthly', priority: 0.8, lastmod: new Date().toISOString() },
      // { loc: '/contact', changefreq: 'monthly', priority: 0.8, lastmod: new Date().toISOString() },
    ];
  },

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/private/',
          '/*.json$',
          '/*.js$',
          '/*.css$',
          '/404',
          '/500',
        ],
      },
      // Specific rules for bots that might cause issues
      {
        userAgent: 'GPTBot',
        disallow: ['/'], // Block OpenAI's web crawler if desired
      },
    ],
    additionalSitemaps: [
      // Add any additional sitemaps here if needed
      // `${process.env.NEXT_PUBLIC_SITE_URL}/server-sitemap.xml`,
    ],
  },
  autoLastmod: true,
  // Don't set outDir and sourceDir - use default behavior
  // outDir: './public',
  // sourceDir: './.next',
  // Optional: Set this to true to include a sitemap index file
  // This is useful for very large sites
  // sitemapSize: 5000,
};
