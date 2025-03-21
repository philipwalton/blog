import assert from 'assert';
import {Key} from 'webdriverio';
import {clearStorage} from './utils/clearStorage.js';
import {initBook} from '../../tasks/lib/book.js';

let site;
let articles;
let pages;

describe('The content loader', async () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    articles = book.articles;
    pages = book.pages;

    await clearStorage();
  });

  beforeEach(async () => {
    await browser.url('/');

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      return title == pages[0].title + site.titleSuffix;
    });

    // Don't use an arrow function since this is eval'ed in test browsers.
    await browser.execute(function () {
      return (window.__INITIAL_PAGE_LOAD__ = true);
    });
  });

  it('should load page partials instead of full pages', async () => {
    const articleLink = await $(`a[href="${articles[0].path}"]`);
    await articleLink.click();

    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == articles[0].title + site.titleSuffix &&
        urlPath == articles[0].path
      );
    });

    await assertIsInitialPageLoad();
  });

  it('should not attempt to load non-HTML content', async () => {
    const articleLink = await $(`a[href="${articles[28].path}"]`);
    await articleLink.click();

    await browser.waitUntil(async () => {
      const urlPath = await getUrlPath();
      return urlPath == articles[28].path;
    });

    const img = await $('figure img');
    await img.click();

    await browser.waitUntil(async () => /\.webp$/.test(await getUrlPath()));
  });

  it('should work with the back and forward buttons', async () => {
    // Ensures the viewport is big enough so all navigation is present.
    browser.setWindowSize(1024, 768);

    // Navigates to an article.
    const articleLink = await $(`a[href="${articles[0].path}"]`);
    await articleLink.click();
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == articles[0].title + site.titleSuffix &&
        urlPath == articles[0].path
      );
    });

    // Navigates to a page.
    const pageLink = await $(`a[href="${pages[2].path}"]`);
    await pageLink.click();
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == pages[2].title + site.titleSuffix && urlPath == pages[2].path
      );
    });

    // Navigates back to the article.
    await browser.back();
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == articles[0].title + site.titleSuffix &&
        urlPath == articles[0].path
      );
    });

    // Navigates back home.
    await browser.back();
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == pages[0].title + site.titleSuffix && urlPath == pages[0].path
      );
    });

    // Navigates forward to the article.
    await browser.forward();
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == articles[0].title + site.titleSuffix &&
        urlPath == articles[0].path
      );
    });

    // Navigates forward to the page.
    await browser.forward();
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      const urlPath = await getUrlPath();
      return (
        title == pages[2].title + site.titleSuffix && urlPath == pages[2].path
      );
    });

    await assertIsInitialPageLoad();
  });

  it('should scroll to the top for "new" pages', async () => {
    const articleLink = await $('.ArticleList-item:last-child a');
    await articleLink.click();

    const articleTitle = await $('.ContentHeader-articleTitle');
    await articleTitle.waitForDisplayed();

    await assertIsInitialPageLoad();
  });

  it('should jump to an anchor for URLs with hash fragments', async () => {
    // Adds a hash fragments to an article URL.
    // Don't use an arrow function since this is eval'ed in test browsers.
    await browser.execute(function () {
      document.querySelector('.ArticleList-item:last-child a').href += '#share';
    });

    const articleLink = await $('.ArticleList-item:last-child a');
    await articleLink.click();

    const shareButton = await $('#share');
    assert(await shareButton.isDisplayed({withinViewport: true}));

    await assertIsInitialPageLoad();
  });

  it('should show an error if the content cannot be loaded', async () => {
    // Adds a hash fragments to an article URL.
    // Don't use an arrow function since this is eval'ed in test browsers.
    await browser.execute(function () {
      document.querySelector('.ArticleList-item:first-child a').href =
        '/non-existent-page/';
      document.querySelector('.ArticleList-item:last-child a').href =
        '/another-non-existent-page/';
    });

    const articleLink1 = await $('.ArticleList-item:first-child a');
    await articleLink1.click();

    const alert1 = await $('.Alert');

    // Pause so when watching the test you can visually see the alert come in.
    await browser.pause(1000);

    assert((await alert1.getText()).includes('(404) Not Found'));

    await browser.keys([Key.Escape]);
    // Give the alert time to animate out.
    await browser.pause(200);

    assert(!(await alert1.isExisting()));

    const articleLink2 = await $('.ArticleList-item:last-child a');
    await articleLink2.click();

    // Give the alert time to animate in.
    await browser.pause(200);

    const alert2 = await $('.Alert');

    // Pause so when watching the test you can visually see the alert come in.
    await browser.pause(1000);

    assert((await alert2.getText()).includes('(404) Not Found'));

    const closeButton = $('.Alert-close');
    await closeButton.click();

    // Give the alert time to animate out.
    await browser.pause(200);

    assert(!(await alert2.isExisting()));
  });
});

/**
 * Asserts that the browser hasn't reloaded the page since the test started.
 */
async function assertIsInitialPageLoad() {
  // Don't use an arrow function since this is eval'ed in test browsers.
  const isInitialPageLoad = await browser.execute(function () {
    return window.__INITIAL_PAGE_LOAD__;
  });

  assert(isInitialPageLoad);
}

/**
 * Gets the URL path for the given page.
 * @return {string} The URL path.
 */
async function getUrlPath() {
  return new URL(await browser.getUrl(), site.baseUrl).pathname;
}
