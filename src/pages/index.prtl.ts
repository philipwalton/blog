import type {APIRoute} from 'astro';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import {loadRenderers} from 'astro:container';
import {getContainerRenderer as getMDXRenderer} from '@astrojs/mdx/container-renderer';
import PagePartialLayout from '../layouts/PagePartialLayout.astro';
import HomeContent from '../components/HomeContent.astro';

export const GET: APIRoute = async () => {
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({renderers});

  // Render the shared HomeContent component
  const homeHtml = await container.renderToString(HomeContent);

  // Render the partial layout with the home content as slot
  const html = await container.renderToString(PagePartialLayout, {
    props: {
      title: 'Home',
      heading: 'Recent Articles',
    },
    slots: {
      default: homeHtml,
    },
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
