// Import polyfills not in `babel-polyfill` need for the nomodule case.
import 'whatwg-fetch';

// Import main.js after the polyfills are loaded.
import './main';
