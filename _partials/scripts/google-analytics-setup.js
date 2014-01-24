{{#is site.env 'production'}}
  {{#if site.googleAnalyticsTrackingID}}

    // Adapted from the following source:
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#snippetReference

  /**
   * Creates a temporary global ga object and loads analytics.js.
   * Paramenters o, a, and m are all used internally. They could have been declared using 'var',
   * instead they are declared as parameters to save 4 bytes ('var ').
   *
   * @param {Window}      i The global context object.
   * @param {Document}    s The DOM document object.
   * @param {string}      o Must be 'script'.
   * @param {string}      r Global name of analytics object.  Defaults to 'ga'.
   * @param {DOMElement?} a Async script tag.
   * @param {DOMElement?} m First script tag in document.
   */
  (function(i, s, o, r, a, m){
    i['GoogleAnalyticsObject'] = r; // Acts as a pointer to support renaming.

    // Creates an initial ga() function.  The queued commands will be executed once analytics.js loads.
    i[r] = i[r] || function() {
      (i[r].q = i[r].q || []).push(arguments)
    },

    // Sets the time (as an integer) this tag was executed.  Used for timing hits.
    i[r].l = 1 * new Date();
  })(window, document, 'script', 'ga');

  ga('create', '{{site.googleAnalyticsTrackingID}}', 'auto'); // Creates the tracker with default parameters.
  ga('send', 'pageview');            // Sends a pageview hit.

  {{/if}}
{{/is}}
