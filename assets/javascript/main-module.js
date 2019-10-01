import {initialize as initializeDynamicImport} from 'dynamic-import-polyfill/initialize.mjs';
import {main} from './main';

// This needs to be done before any dynamic imports are used.
// If your modules are hosted in a sub-directory, it must be specified here.
initializeDynamicImport({modulePath: '/modules/'});

// Start the app.
main();
