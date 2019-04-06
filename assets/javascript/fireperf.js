import {initializeApp} from 'firebase/lite/dist/index.esm.js';


const appId = '1:48175167448:web:45863557eb40ee1a';
const fireperf = initializeApp({appId}).performance();

// Don't send data when not in production.
if (location.hostname !== 'philipwalton.com') {
  fireperf.isDataCollectionEnabled = false;
  fireperf.isInstrumentationEnabled = false;
}

export {fireperf};
