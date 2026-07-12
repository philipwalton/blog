import type {APIRoute} from 'astro';
import PagePartialLayout from '../../layouts/PagePartialLayout.astro';
import ArticlesListContent from '../../components/ArticlesListContent.astro';
import {renderPartialResponse} from '../../utils/renderPartial.ts';

export const GET: APIRoute = async () => {
  return renderPartialResponse(
    PagePartialLayout,
    {title: 'Articles'},
    ArticlesListContent,
  );
};
