import type {APIRoute} from 'astro';

const site = {
  title: 'Philip Walton',
  slug: 'philipwalton',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
};

export const GET: APIRoute = async () => {
  const manifest = {
    name: site.title,
    short_name: site.slug,
    start_url: '/?utm_source=homescreen',
    display: 'standalone',
    theme_color: site.themeColor,
    background_color: site.backgroundColor,
    icons: [
      {
        src: '/static/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/static/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
};
