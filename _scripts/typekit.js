/* global Typekit, ga */

var TIMEOUT_DURATION = 2000;
var timeout;

function loadTypeKit() {
  try {
    Typekit.load({
      active: function() {
        clearTimeout(timeout);
      }
    });
  }
  catch(err) {
    addErrorClass();
    trackError(err.stack || err);
  }
}


function handleLoadError() {
  addErrorClass();
  clearTimeout(timeout);
  trackError('Error loading typekit script');
}


function handleTimeout() {
  addErrorClass();
  trackError('Timeout loading typekit script');
}


function trackError(message) {
  ga('send', 'exception', {
    exDescription: message,
    exFatal: false
  });
}


function addErrorClass() {
  document.documentElement.className += ' is-typekitError';
}


module.exports = {
  init: function() {

    timeout = setTimeout(handleTimeout, TIMEOUT_DURATION);

    // Load typekit immediately if the script is download, otherwise queue it.
    // Note: Using IEs readyState isn't needed here because IE<10 doesn't
    // support <script async>, thus it will load blockingly.

    if (window.Typekit) {
      loadTypeKit();
    }
    else {
      var typekitScript = document.getElementById('typekit');
      typekitScript.onload = loadTypeKit;
      typekitScript.onerror = handleLoadError;
    }
  }
};
