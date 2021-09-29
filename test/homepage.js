import assert from 'assert';
import {initBook} from '../tasks/utils/book.js';


let site;
let articles;
let pages;

describe('The home page', () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    articles = book.articles;
    pages = book.pages;
  });

  before(async () => {
    await browser.url('/');
    await browser.setWindowSize(800, 600);

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      return title === pages[0].title + site.titleSuffix;
    });
  });

  beforeEach(async () => {
    const url = await browser.getUrl();
    if (url !== '/') {
      const homepageLink = await $('a[href="/"]');
      await homepageLink.click();
    }
  });

  it('should have the right title', async () => {
    const actualTitle = await browser.getTitle();
    const expectedTitle = pages[0].title + site.titleSuffix;
    assert.strictEqual(actualTitle, expectedTitle);
  });

  it('should contain working links to all published articles', async () => {
    const lastArticle = articles[articles.length - 1];

    for (let i = 1, article; article = articles[i - 1]; i++) {
      const heading = await $(`.ArticleList-item:nth-last-child(${i}) h2`);
      const link = await $(`.ArticleList-item:nth-last-child(${i}) a`);

      const headingTitle = await heading.getText();
      assert.strictEqual(headingTitle, article.title);

      const linkHref = await link.getAttribute('href');
      assert.strictEqual(
          new URL(linkHref, site.baseUrl).pathname, article.path);

      await link.click();
      await browser.waitUntil(urlMatches(article.path));

      const pageTitle = await browser.getTitle();
      assert.strictEqual(pageTitle, article.title + site.titleSuffix);

      if (article !== lastArticle) {
        const homepageLink = await $('a[href="/"]');
        await homepageLink.click();
      }
    }
  });

  it('should contain working links to pages', async () => {
    const contentPages = pages.filter((page) => {
      return !(
          page.path == '/404.html' ||
          page.path == '/atom.xml' ||
          page.path == '/manifest.json');
    });

    for (let i = 1, page; page = contentPages[i-1]; i++) {
      const pageLink = await $(`.Header a[title="${page.title}"]`);
      const pageLinkHref = await pageLink.getAttribute('href');
      assert.strictEqual(
          new URL(pageLinkHref, site.baseUrl).pathname, page.path);

      await pageLink.click();
      await browser.waitUntil(urlMatches(page.path));

      const pageTitle = await browser.getTitle();
      assert.strictEqual(pageTitle, page.title + site.titleSuffix);
    }
  });
});


/**
 * Returns whether the passed URL matches the URL for the current page.
 * @param {string} expectedUrl The URL to test against.
 * @return {() => Promise<boolean>} True if the passed URL matches.
 */
function urlMatches(expectedUrl) {
  return async () => {
    const url = await browser.getUrl();
    return url.includes(expectedUrl);
  };
}
