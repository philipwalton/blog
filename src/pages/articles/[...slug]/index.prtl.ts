import type {APIRoute} from 'astro';
import {render, type CollectionEntry} from 'astro:content';
import ArticlePartialLayout from '../../../layouts/ArticlePartialLayout.astro';
import {renderPartialResponse} from '../../../utils/renderPartial.ts';
import {getArticleStaticPaths} from '../../../utils/articles.ts';

export const getStaticPaths = getArticleStaticPaths;

export const GET: APIRoute = async ({props}) => {
  const {article} = props as {article: CollectionEntry<'articles'>};
  const {Content} = await render(article);

  return renderPartialResponse(
    ArticlePartialLayout,
    {
      title: article.data.title,
      date: new Date(article.data.date),
      path: `/articles/${article.id}/`,
      translations: article.data.translations,
    },
    Content,
  );
};
