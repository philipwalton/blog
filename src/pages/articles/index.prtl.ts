import type {APIRoute} from 'astro';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import {loadRenderers} from 'astro:container';
import {getContainerRenderer as getMDXRenderer} from '@astrojs/mdx/container-renderer';
import PagePartialLayout from '../../layouts/PagePartialLayout.astro';
import ArticlesListContent from '../../components/ArticlesListContent.astro';

export const GET: APIRoute = async () => {
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({renderers});

  // Render the shared ArticlesListContent component
  const articlesHtml = await container.renderToString(ArticlesListContent);

  // Render the partial layout with the articles list as slot
  const html = await container.renderToString(PagePartialLayout, {
    props: {
      title: 'Articles',
    },
    slots: {
      default: articlesHtml,
    },
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
