var _ = require('lodash-node/modern');
var browserify = require('browserify');
var shelljs = require('shelljs');

module.exports = function() {

  var Handlebars = this.Handlebars;
  var bundle = shelljs.exec(
      'browserify --no-detect-globals _scripts/main.js', {silent: true}).output;

  Handlebars.registerHelper('inlineJavaScript', function() {
    return bundle;
  });
};
