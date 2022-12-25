import functions from 'firebase-functions';
import {log as logFn} from './log.js';

// https://firebase.google.com/docs/functions/write-firebase-functions
export const log = functions.https.onRequest(logFn);
