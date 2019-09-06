const express = require('express');
const morgan = require('morgan');
const path = require('path');
const superstatic = require('superstatic');

const PORT = 5000;
let server;

const app = express()
    // Log requests that make it to the server.
    .use(morgan('dev'))
    // Any request matching this pattern will return a test fixture.
    .use(/^\/__(.+)__/, (req, res, next) => {
      res.sendFile(path.resolve(`test/fixtures/${req.params[0]}.html`));
    })
    // All other requests will use superstatic
    // https://github.com/firebase/superstatic#superstaticoptions
    .use(superstatic());

const start = async ({verbose = true} = {}) => {
  await new Promise((resolve, reject) => {
    server = app.listen(PORT, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const stop = () => {
  server.close();
};

module.exports = {start, stop};
