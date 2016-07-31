const assert = require('assert');
const fs = require('fs');
const yaml = require('js-yaml');


const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
const titleSuffix = ' \u2014 Philip Walton';


describe('Navigation drawer', () => {

  beforeEach(() => browser.url('/'));


  it('should show the menu icon but no nav links on small screens', () => {
    browser
        .setViewportSize({width: 375, height: 627}, false)
        .waitForVisible('#drawer-toggle');
  });


  it('should show the nav links but no menu icon on large screens', () => {
    browser
        .setViewportSize({width: 800, height: 600}, false)
        .waitForVisible('#drawer-contents');

    assert(!browser.isVisible('#drawer-toggle'));
  });


  it('should open a closed drawer when the menu icon is clicked', () => {
    browser
        .setViewportSize({width: 375, height: 627}, false)
        .click('#drawer-toggle')
        .waitForVisible('#drawer-contents');
  });


  it('should close an open drawer when the menu icon is clicked', () => {
    browser
        .setViewportSize({width: 375, height: 627}, false)
        .click('#drawer-toggle')
        .waitForVisible('#drawer-contents');

    browser
        .click('#drawer-toggle')
        .waitUntil(() => !browser.isVisible('#drawer-contents'));
  });


  it('should close an open drawer when clicking a nav link to a new page',
      () => {

    browser.setViewportSize({width: 375, height: 627}, false);
    // Waits for the links to be clickable.
    browser.click('#drawer-toggle').pause(200);
    browser.click(`a[href="${book.pages[2].path}"]`);

    browser.waitUntil(() =>
        browser.getTitle() == book.pages[2].title + titleSuffix);

    browser.waitUntil(() => !browser.isVisible('#drawer-contents'));
  });


  it('should close an open drawer when clicking anywhere else', () => {
    browser.setViewportSize({width: 375, height: 627}, false);

    browser
        .click('#drawer-toggle')
        .waitForVisible('#drawer-contents');

    browser
        .click('body')
        .waitUntil(() => !browser.isVisible('#drawer-contents'));
  });

});
