const functions = require('firebase-functions');
const {log} = require('./log');


// https://firebase.google.com/docs/functions/write-firebase-functions
exports.log = functions.https.onRequest(log);
