const express = require('express');
const path = require('path');
const superstatic = require('superstatic');


const PORT = 5000;

const app = express()
    // Any request matching this pattern will return a test fixture.
    .use(/^\/__(.+)__/, (req, res, next) => {
      res.sendFile(path.resolve(`test/fixtures/${req.params[0]}.html`));
    })
    // All other requests will use superstatic
    // https://github.com/firebase/superstatic#superstaticoptions
    .use(superstatic());

const start = async ({verbose = true} = {}) => {
  await new Promise((resolve, reject) => {
    app.listen(PORT, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const stop = () => {
  app.close();
};

module.exports = {start, stop};
