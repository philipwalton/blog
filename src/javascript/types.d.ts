declare global {
  interface WindowOrWorkerGlobalScope {
    __PARTIAL_PATH__: string;
    __ENV__: 'development' | 'production';

    __PARTIAL_PATH__: string;
    __VERSION__: string;
    __BUILD_TIME__: number;
    __PRECACHE_MANIFEST__: string[];

    // Experiment global from _log.html
    __x?: string;

    // Error queue from _log.html for capturing errors that occur before
    // analytics initialization.
    __e: ((event: ErrorEvent | PromiseRejectionEvent) => void) & {
      q: Array<ErrorEvent | PromiseRejectionEvent>;
    };

    navigation: Navigation;
  }

  // https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigation-interface
  interface Navigation {
    addEventListener(
      type: 'navigate',
      listener: (event: NavigateEvent) => void,
    ): void;
    updateCurrentEntry(options: {state?: any}): void;
  }

  interface NavigateEvent {
    destination: NavigationDestination;
    preventDefault(): void;
    intercept(options: {handler: () => void | Promise<void>}): void;
  }

  interface NavigationDestination {
    url: string;
    getState(): any;
  }

  // User-Agent Client Hints API types
  // https://wicg.github.io/ua-client-hints/#dictdef-navigatoruabrandversion
  interface NavigatorUABrandVersion {
    readonly brand: string;
    readonly version: string;
  }

  interface NavigatorUAData {
    getHighEntropyValues(hints: string[]): Promise<{
      architecture?: string;
      bitness?: string;
      model?: string;
      mobile?: boolean;
      fullVersionList?: Array<NavigatorUABrandVersion>;
      platform?: string;
      platformVersion?: string;
      wow64?: boolean;
    }>;
  }

  interface Navigator {
    userAgentData?: NavigatorUAData;
  }

  // Network Information API types
  interface NetworkInformation {
    readonly effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  }

  interface Navigator {
    connection?: NetworkInformation;
  }

  // Fetch Later API types
  // https://fetch.spec.whatwg.org/#fetchlaterresult
  interface FetchLaterResult {
    readonly activated: boolean;
  }

  interface DeferredRequestInit extends RequestInit {
    activateAfter?: number;
  }

  interface WindowOrWorkerGlobalScope {
    fetchLater(url: string | URL, init?: DeferredRequestInit): FetchLaterResult;
  }
}

export {};
