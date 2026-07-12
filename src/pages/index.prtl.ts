import type {APIRoute} from 'astro';
import PagePartialLayout from '../layouts/PagePartialLayout.astro';
import HomeContent from '../components/HomeContent.astro';
import {renderPartialResponse} from '../utils/renderPartial.ts';

export const GET: APIRoute = async () => {
  return renderPartialResponse(
    PagePartialLayout,
    {
      title: 'Home',
      heading: 'Recent Articles',
    },
    HomeContent,
  );
};
