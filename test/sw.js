const assert = require('assert');
const fse = require('fs-extra');


describe('Service Worker', () => {
  beforeEach(() => {
    restoreSWVersion();
    browser.url('/__reset__');
  });

  after(() => {
    restoreSWVersion();
  });

  it(`should not show an update notice after the very first registration`, () => {
    browser.url('/');
    waitUntilControlling();

    assert(!$('.Message').isExisting());
  });

  it(`should show an update notice if the major version in the SW changes`, () => {
    updateSWVersion('1.0.0');

    browser.url('/?v=1');
    waitUntilControlling();

    updateSWVersion('2.0.0');
    browser.url('/?v=2');

    $('.Message').waitForExist(5000);
  });

  it(`should not show an update notice for non-major SW version changes`, () => {
    updateSWVersion('1.0.0');

    browser.url('/');
    waitUntilControlling();

    updateSWVersion('1.9.9');
    browser.url('/');

    // This is a bit hacky, but just waiting the controllerchange in an
    // `executeAsync()` call fails for some reason...`
    browser.execute((done) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.__controllerVersion__ = '1.9.9';
      });
    });

    browser.waitUntil(() => {
      return browser.execute(() => {
        return window.__controllerVersion__ === '1.9.9';
      });
    });

    assert(!$('.Message').isExisting());
  });
});


const originalSWContents = fse.readFileSync('./build/sw.js', 'utf-8');
const originalSWVersion =
    JSON.stringify(fse.readJSONSync('./package.json').version);

const updateSWVersion = (newVersion) => {
  const oldVersion =
      new RegExp(originalSWVersion.replace(/\./g, '\\.'), ['g']);

  fse.outputFileSync('./build/sw.js',
      originalSWContents.replace(oldVersion, JSON.stringify(newVersion)));

  browser.waitUntil(() => {
    const {value} = browser.executeAsync(async (done) => {
      const res = await fetch('/sw.js');
      const text = await res.text();
      done(/"\d+\.\d+\.\d+"/.exec(text));
    });
    return value && value[0] === JSON.stringify(newVersion);
  });
};

const restoreSWVersion = () => {
  fse.outputFileSync('./build/sw.js', originalSWContents);
};

const waitUntilControlling = () => {
  browser.waitUntil(() => {
    const {value} = browser.executeAsync(async (done) => {
      const reg = await navigator.serviceWorker.getRegistration();
      done(reg && reg.active &&
          reg.active === navigator.serviceWorker.controller);
    });
    return value === true;
  });
};
