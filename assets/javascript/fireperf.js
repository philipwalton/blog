import * as firebase from 'firebase/lite/dist/index.esm.js';

const appId = '1:48175167448:web:45863557eb40ee1a';

export const init = () => {
  if (location.hostname === 'philipwalton.com') {
    firebase.initializeApp({appId}).performance();
  }
};
