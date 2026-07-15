import type {APIRoute} from 'astro';
import {getCollection} from 'astro:content';
import {site} from '../config.ts';

function formatDateISO(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles');
  const sortedArticles = articles.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );

  const buildTime = new Date();

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${site.title}</title>
  <link href="${site.baseUrl}/atom.xml" rel="self"/>
  <link href="${site.baseUrl}/"/>
  <updated>${formatDateISO(buildTime)}</updated>
  <id>${site.baseUrl}/</id>
  <author>
    <name>Philip Walton</name>
    <email>philip@philipwalton.com</email>
  </author>
${sortedArticles
  .map(
    (article) => `  <entry>
    <title>${article.data.title}</title>
    <link href="${site.baseUrl}/articles/${article.id}/"/>
    <updated>${formatDateISO(new Date(article.data.date))}</updated>
    <id>${site.baseUrl}/articles/${article.id}/</id>
  </entry>`,
  )
  .join('\n')}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  });
};
