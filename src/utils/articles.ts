import {getCollection} from 'astro:content';

/**
 * Returns the static paths (and props) for every article, shared by the
 * article page route and its partial endpoint.
 */
export async function getArticleStaticPaths() {
  const articles = await getCollection('articles');
  return articles.map((article) => ({
    params: {slug: article.id},
    props: {article},
  }));
}
