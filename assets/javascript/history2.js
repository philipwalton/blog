var parseUrl = require('./parse-url');

function History2() {

  // Store the current url information.
  this.currentPage = parseUrl(window.location.href);
  this.currentPage.title = document.title;

  // Add history state initially so the first `popstate` event contains data.
  history.replaceState(
      this.currentPage,
      this.currentPage.title,
      this.currentPage.href);

  this._queue = [];

  // Listen for popstate changes and log them.
  var self = this;
  window.addEventListener('popstate', function(event) {
    var state = event.state;
    var title = state && state.title;
    self.add(window.location.href, title, state, event);
  });
}


History2.prototype.add = function(url, title, state, event) {

  // Ignore urls pointing to the current address
  if (url == this.currentPage.href) return;

  this.nextPage = parseUrl(url);
  this.nextPage.title = title;
  this.nextPage.state = state;

  this._processQueue(event);
};


/**
 * Register a plugin with the History2 instance.
 * @param {Function(History2, done)} - A plugin that runs some task and
 *     informs the next plugin in the queue when it's done.
 */
History2.prototype.use = function(plugin) {
  this._queue.push(plugin);

  return this;
};


/**
 * Register a handler to catch any errors.
 * Note: In ES3 reserved words like "catch" couldn't be used as property names:
 * http://kangax.github.io/compat-table/es5/#Reserved_words_as_property_names
 * @param {Function(Error)} - The function to handle the error.
 */
History2.prototype['catch'] = function(onError) {
  this._onError = onError;

  return this;
};


History2.prototype._onError = function(error) {
  // Left blank so calling `_onError` never fails.
  console.error(error.stack);
};


History2.prototype._onComplete = function(event) {

  if (this.nextPage.title) document.title = this.nextPage.title;

  // Popstate triggered navigation is already handled by the browser,
  // so we only add to the history in non-popstate cases.
  if (!(event && event.type == 'popstate')) {
    history.pushState(
        this.nextPage,
        this.nextPage.title,
        this.nextPage.href);
  }

  // Update the last url to the current url
  this.currentPage = this.nextPage;
  this.nextPage = null;
};


History2.prototype._processQueue = function(event) {
  var self = this;
  var i = 0;

  (function next() {

    var plugin = self._queue[i++];
    var isSync = plugin && !plugin.length;

    if (!plugin) return self._onComplete(event);

    // The callback for async plugins.
    function done(error) {
      if (error) {
        self._onError(error);
      }
      else {
        next();
      }
    }

    try {
      plugin.apply(self, isSync ? [] : [done]);
    }
    catch(error) {
      return self._onError(error);
    }

    // Sync plugins are done by now and can immediately process
    // the next item in the queue.
    if (isSync) next();

  }());
};


module.exports = History2;
