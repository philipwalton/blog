declare global {
  interface WindowOrWorkerGlobalScope {
    // Experiment global from _log.html
    __x?: string;

    // Error queue from _log.html for capturing errors that occur before
    // analytics initialization.
    __e: ((event: ErrorEvent | PromiseRejectionEvent) => void) & {
      q: Array<ErrorEvent | PromiseRejectionEvent>;
    };
  }
}

export {};
