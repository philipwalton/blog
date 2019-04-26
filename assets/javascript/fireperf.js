import {initializeApp} from 'fireperf';


const firebaseConfig = {
  apiKey: 'AIzaSyDS9lRE9U9zLRbKH1X9L1XU16wJEGZUCw4',
  // authDomain: "philipwalton-fireperf.firebaseapp.com",
  // databaseURL: "https://philipwalton-fireperf.firebaseio.com",
  projectId: 'philipwalton-fireperf',
  // storageBucket: "philipwalton-fireperf.appspot.com",
  // messagingSenderId: "48175167448",
  appId: '1:48175167448:web:45863557eb40ee1a',
};

const fireperf = initializeApp(firebaseConfig).performance();

export {fireperf};
