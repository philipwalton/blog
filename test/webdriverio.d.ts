// webdriverio's public types don't declare `ChainablePromiseElement`/
// `ChainablePromiseArray` as thenable, even though the Proxy objects they
// describe do implement `then()` at runtime (see `$`/`$$`). Without this,
// TypeScript treats `await $(...)` as a no-op.
declare module 'webdriverio' {
  // The empty bodies are the point: this is TS declaration merging, not a
  // redundant interface, so the "equivalent to its supertype" lint is a
  // false positive here.
  /* eslint-disable @typescript-eslint/no-empty-object-type */
  interface ChainablePromiseElement extends PromiseLike<WebdriverIO.Element> {}
  interface ChainablePromiseArray extends PromiseLike<WebdriverIO.Element[]> {}
  /* eslint-enable @typescript-eslint/no-empty-object-type */
}

export {};
