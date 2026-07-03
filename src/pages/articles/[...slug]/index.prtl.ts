import type {APIRoute, GetStaticPaths} from 'astro';
import {getCollection, render} from 'astro:content';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import {loadRenderers} from 'astro:container';
import {getContainerRenderer as getMDXRenderer} from '@astrojs/mdx/container-renderer';
import ArticlePartialLayout from '../../../layouts/ArticlePartialLayout.astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getCollection('articles');
  return articles.map((article) => ({
    params: {slug: article.id},
    props: {article},
  }));
};

export const GET: APIRoute = async ({props}) => {
  const {article} = props as {
    article: Awaited<ReturnType<typeof getCollection>>[number];
  };
  const {Content} = await render(article);

  // Create container with MDX renderer
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({renderers});

  // Render the Content component to get the MDX HTML
  const contentHtml = await container.renderToString(Content);

  // Render the full partial layout with the content as a slot
  const html = await container.renderToString(ArticlePartialLayout, {
    props: {
      title: article.data.title,
      date: new Date(article.data.date),
      path: `/articles/${article.id}/`,
      translations: article.data.translations,
    },
    slots: {
      default: contentHtml,
    },
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
