// Import polyfills not in `core-js` for the nomodule builds.
import 'whatwg-fetch';

// Import main.js after the polyfills are loaded.
import {main} from './main';

// Start the app.
main();
