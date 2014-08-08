var History2 = (function(window, document, location) {

  function History2() {

    // Store the current url information.
    this.current = parseUrl(location.href);
    this.current.title = document.title;

    this._queue = [];

    // Add history state initially so the first `popstate` event contains data.
    history.replaceState(this.current, document.title, this.current.href);

    // Listen for popstate changes and log them.
    addEventListener('popstate', function(event) {
      var state = event.state;
      var title = state && state.title;
      this.add(location.href, title, state, event);
    }.bind(this));
  }


  History2.prototype.add = function(url, title, state, event) {

    // Ignore urls pointing to the current address
    if (url == this.current.href) return;

    this.next = parseUrl(url);
    this.next.title = title;
    this.next.state = state;
    this.event = event;

    // If path is different this resource
    // points to a different page.
    if (this.next.path != this.current.path) {
      this._processQueue();
    }
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


  History2.prototype._processQueue = function() {
    var self = this;
    var i = 0;

    (function next() {

      var plugin = self._queue[i++];
      var isSync = plugin && !plugin.length;

      if (!plugin) return self._onComplete();

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


  History2.prototype._onError = function(error) {
    // Left blank so calling `_onError` never fails.
    console.error(error.stack);
  };


  History2.prototype._onComplete = function() {

    // Popstate triggered navigation is already handled by the browser,
    // so we only add to the history in non-popstate cases.
    if (!(this.event && this.event.type == 'popstate')) {
      history.pushState(this.next.state, this.next.title, this.next.href);
    }

    if (this.next.title) document.title = this.next.title;


    // Update the last url to the current url
    this.current = this.next;
    this.next = null;

    // Clear out the previous event
    this.event = null
  };


  return History2;

}(window, document, window.location));
