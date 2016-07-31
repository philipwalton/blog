import assert from 'assert';
import fs from 'fs';
import yaml from 'js-yaml';


const book = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
const titleSuffix = ' \u2014 Philip Walton';


describe('Navigation drawer', function() {

  beforeEach(function() {
    return browser.url('/');
  });


  it('should show the menu icon but no nav links on small screens',
      function*() {

    return browser
        .setViewportSize({width:375, height:627}, false)
        .waitForVisible('#drawer-toggle');

    let linksAreVisible = yield browser.isVisible('#drawer-contents');
    assert(linksAreVisible === false);
  });


  it('should show the nav links but no menu icon on large screens',
      function*() {

    yield browser
        .setViewportSize({width:800, height:600}, false)
        .waitForVisible('#drawer-contents');

    let menuIconIsVisible = yield browser.isVisible('#drawer-toggle');
    assert(menuIconIsVisible === false);
  });


  it('should open a closed drawer when the menu icon is clicked', function() {
    return browser
        .setViewportSize({width:375, height:627}, false)
        .click('#drawer-toggle')
        .waitForVisible('#drawer-contents');
  });


  it('should close an open drawer when the menu icon is clicked', function() {
    return browser
        .setViewportSize({width:375, height:627}, false)
        .click('#drawer-toggle')
        .waitForVisible('#drawer-contents')
        .click('#drawer-toggle')
        .waitUntil(elementNoLongerVisible('#drawer-contents'));
  });


  it('should close an open drawer when clicking a nav link to a new page',
      function*() {

    let newPageTitle = yield browser
        .setViewportSize({width:375, height:627}, false)
        .click('#drawer-toggle')
        .pause(200) // Waits for the links to be clickable.
        .click(`a[href="${book.pages[2].path}"]`)
        .getTitle();

    assert.equal(newPageTitle, book.pages[2].title + titleSuffix)

    yield browser.waitUntil(elementNoLongerVisible('#drawer-contents'));

  });


  it('should close an open drawer when clicking anywhere else', function() {
    return browser
        .setViewportSize({width:375, height:627}, false)
        .click('#drawer-toggle')
        .waitForVisible('#drawer-contents')
        .click('body')
        .waitUntil(elementNoLongerVisible('#drawer-contents'));
  });

});


function elementNoLongerVisible(selector) {
  return function() {
    return browser.isVisible(selector).then(function(isVisible) {
      return !isVisible;
    });
  };
}
