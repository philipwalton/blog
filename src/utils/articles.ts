import {getCollection} from 'astro:content';

/**
 * Returns all entries from the `articles` collection sorted newest-first
 * by their `date` frontmatter field.
 */
export async function getSortedArticles() {
  const articles = await getCollection('articles');
  return articles.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );
}
