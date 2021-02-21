const assert = require('assert');
const fs = require('fs-extra');


describe('Service Worker', () => {
  beforeEach(async () => {
    restoreSWVersion();
    await browser.url('/__reset__');
  });

  after(() => {
    restoreSWVersion();
  });

  it(`should not show an update notice after the very first registration`, async () => {
    await browser.url('/');
    await waitUntilControlling();

    const message = await $('.Message');
    assert.strictEqual(await message.isExisting(), false);
  });

  it(`should show an update notice if the major version in the SW changes`, async () => {
    await updateSWVersion('1.0.0');

    await browser.url('/?v=1');
    await waitUntilControlling();


    await updateSWVersion('2.0.0');

    // For some reason, the SW update check doesn't always trigger if we
    // reload the page right away.
    await browser.pause(2000);

    await browser.url('/?v=2');

    const message = await $('.Message');
    await message.waitForDisplayed();

    // Pause so when watching the test you can visually see the message.
    await browser.pause(1000);
  });

  it(`should not show an update notice for non-major SW version changes`, async () => {
    await updateSWVersion('1.0.0');

    await browser.url('/');
    await waitUntilControlling();

    await updateSWVersion('1.9.9');
    await browser.url('/');

    // This is a bit hacky, but just waiting the controllerchange in an
    // `executeAsync()` call fails for some reason...`
    await browser.execute(() => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.__controllerVersion__ = '1.9.9';
      });
    });

    await browser.waitUntil(async () => {
      return await browser.execute(() => {
        return window.__controllerVersion__ === '1.9.9';
      });
    });

    // Pause for a bit longer to really ensure the message isn't showing.
    await browser.pause(1000);

    const message = await $('.Message');
    assert.strictEqual(await message.isExisting(), false);
  });
});


const originalSWContents = fs.readFileSync('./build/sw.js', 'utf-8');
const originalSWVersion =
    JSON.stringify(fs.readJSONSync('./package.json').version);

/**
 * @param {string} newVersion
 * @return {Promise<void>}
 */
async function updateSWVersion(newVersion) {
  const oldVersion =
      new RegExp(originalSWVersion.replace(/\./g, '\\.'), ['g']);

  await fs.outputFile('./build/sw.js',
      originalSWContents.replace(oldVersion, JSON.stringify(newVersion)));

  await browser.waitUntil(async () => {
    const match = await browser.executeAsync(async (done) => {
      const res = await fetch('/sw.js');
      const text = await res.text();
      done(/"\d+\.\d+\.\d+"/.exec(text));
    });
    return match && match[0] === JSON.stringify(newVersion);
  });
}

/**
 * @return {Promise<void>}
 */
async function restoreSWVersion() {
  await fs.outputFile('./build/sw.js', originalSWContents);
}

/**
 * @return {Promise<void>}
 */
async function waitUntilControlling() {
  await browser.waitUntil(async () => {
    return await browser.executeAsync(async (done) => {
      const reg = await navigator.serviceWorker.getRegistration();
      done(reg && reg.active &&
          reg.active === navigator.serviceWorker.controller);
    });
  });
}
