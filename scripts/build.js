/* eslint-disable no-console */

const content = require('./content');
const css = require('./css');
const images = require('./images');
const javascript = require('./javascript');

(async () => {
  try {
    await Promise.all([
      css.build(),
      images.build(),
      javascript.build(),
    ]);

    await content.build();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
