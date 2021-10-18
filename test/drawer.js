import assert from 'assert';
import {initBook} from '../tasks/utils/book.js';


let site;
let pages;

describe('Navigation drawer', () => {
  before(async () => {
    const book = await initBook();
    site = book.site;
    pages = book.pages;

    await browser.url('/__reset__');
    await browser.waitUntil(async () => {
      return await browser.execute(() => {
        return window.__ready__ === true;
      });
    });
  });

  beforeEach(async () => {
    await browser.url('/');

    // I'm not sure why this is needed, but sometime the above command
    // doesn't appear to wait until the page is loaded.
    // (possibly due to service worker???)
    await browser.waitUntil(async () => {
      const title = await browser.getTitle();
      return title === pages[0].title + site.titleSuffix;
    });
  });

  it('should show the menu icon but no nav links on small screens', async () => {
    await browser.setWindowSize(375, 627);

    const drawerToggle = await $('#drawer-toggle');
    await drawerToggle.waitForDisplayed();
  });

  it('should show the nav links but no menu icon on large screens', async () => {
    await browser.setWindowSize(800, 600);

    const drawer = await $('#drawer');
    await drawer.waitForDisplayed();

    const drawerToggle = await $('#drawer-toggle');
    assert.equal(await drawerToggle.isDisplayed(), false);
  });

  it('should open a closed drawer when the menu icon is clicked', async () => {
    await browser.setWindowSize(375, 627);

    const drawerToggle = await $('#drawer-toggle');
    await drawerToggle.click();

    const drawer = await $('#drawer');
    await drawer.waitForDisplayed();
  });

  it('should close an open drawer when the menu icon is clicked', async () => {
    await browser.setWindowSize(375, 627);

    const drawerToggle = await $('#drawer-toggle');
    await drawerToggle.click();

    const drawer = await $('#drawer');
    await drawer.waitForDisplayed();

    await drawerToggle.click();
    await drawer.waitForDisplayed(undefined, true); // Wait for not displayed.
  });

  it('should close an open drawer when clicking a nav link to a new page', async () => {
    await browser.setWindowSize(375, 627);

    const drawerToggle = await $('#drawer-toggle');
    await drawerToggle.click();
    await browser.pause(200);

    const pageLink = await $(`a[href="${pages[2].path}"]`);
    await pageLink.click();

    browser.waitUntil(async () => {
      return (await browser.getTitle()) == pages[2].title + site.titleSuffix;
    });

    const drawer = await $('#drawer');
    await drawer.waitForDisplayed(undefined, true); // Wait for not displayed.
  });

  it('should close an open drawer when clicking anywhere else', async () => {
    await browser.setWindowSize(375, 627);

    const drawerToggle = await $('#drawer-toggle');
    await drawerToggle.click();

    const drawer = await $('#drawer');
    await browser.waitUntil(() => drawer.isDisplayed());

    const body = await $('body');
    await body.click();
    await drawer.waitForDisplayed(undefined, true); // Wait for not displayed.
  });
});
