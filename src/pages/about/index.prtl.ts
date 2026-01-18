import type {APIRoute} from 'astro';
import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import {loadRenderers} from 'astro:container';
import {getContainerRenderer as getMDXRenderer} from '@astrojs/mdx';
import PagePartialLayout from '../../layouts/PagePartialLayout.astro';
import AboutContent from '../../components/AboutContent.astro';

export const GET: APIRoute = async () => {
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({renderers});

  // Render the shared AboutContent component
  const aboutHtml = await container.renderToString(AboutContent);

  // Render the partial layout with the about content as slot
  const html = await container.renderToString(PagePartialLayout, {
    props: {
      title: 'About',
    },
    slots: {
      default: aboutHtml,
    },
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
