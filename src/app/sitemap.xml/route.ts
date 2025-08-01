export async function GET() {
  const baseUrl = 'https://tucapi.com';

  const pages = [
    '',
    '/sign-in',
    '/sign-up',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
  ];

  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
  });
}
