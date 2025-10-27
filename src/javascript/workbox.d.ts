declare module 'workbox-window/Workbox.mjs' {
  export class Workbox {
    constructor(swPath: string);
    addEventListener(event: string, listener: (event: any) => void): void;
    messageSW(message: any): Promise<any>;
    register(): Promise<ServiceWorkerRegistration>;
  }
}
