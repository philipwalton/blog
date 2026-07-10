import {initBook, type Site, type Article} from './utils/book.ts';

let site: Site;
let articles: Article[];

describe('Code syntax highlighting', () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    articles = book.articles;
  });

  beforeEach(async () => {
    const specificityArticleSlug = 'the-ga-setup-i-use-on-every-site-i-build';
    const specificityArticle = articles.find((article) => {
      return article.path.includes(specificityArticleSlug);
    });

    if (!specificityArticle) {
      throw new Error('Google Analytics article not found.');
    }

    await browser.url(specificityArticle.path);

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      return (
        title ===
        (specificityArticle ? specificityArticle.title + site.titleSuffix : '')
      );
    });
  });

  it('should be present on code blocks', async () => {
    const code = await $('.astro-code');
    await code.waitForExist();
  });

  it('should allow for marking specific lines', async () => {
    const mark = await $('.astro-code .line.highlighted');
    await mark.waitForExist();
  });

  it('should allow for marking specific words/characters', async () => {
    const mark = await $('.astro-code .highlighted-word');
    await mark.waitForExist();
  });
});
