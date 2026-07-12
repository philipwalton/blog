import {experimental_AstroContainer as AstroContainer} from 'astro/container';
import {loadRenderers} from 'astro:container';
import {getContainerRenderer as getMDXRenderer} from '@astrojs/mdx/container-renderer';
import type {AstroComponentFactory} from 'astro/runtime/server/index.js';

/**
 * Renders a partial layout (with the given props) whose default slot is the
 * rendered `Content` component, and returns the result as an HTML `Response`.
 */
export async function renderPartialResponse(
  Layout: AstroComponentFactory,
  layoutProps: Record<string, unknown>,
  Content: AstroComponentFactory,
): Promise<Response> {
  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({renderers});

  // Render the content component to get its HTML.
  const contentHtml = await container.renderToString(Content);

  // Render the partial layout with the content HTML as its default slot.
  const html = await container.renderToString(Layout, {
    props: layoutProps,
    slots: {
      default: contentHtml,
    },
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
