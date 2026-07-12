import type {APIRoute} from 'astro';
import PagePartialLayout from '../../layouts/PagePartialLayout.astro';
import AboutContent from '../../components/AboutContent.astro';
import {renderPartialResponse} from '../../utils/renderPartial.ts';

export const GET: APIRoute = async () => {
  return renderPartialResponse(
    PagePartialLayout,
    {title: 'About'},
    AboutContent,
  );
};
