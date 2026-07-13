/**
 * Works around webdriverio (through at least v9.29.1) setting an explicit
 * `Content-Length` header on WebDriver requests, which fetch() on Node >= 26
 * rejects with `UND_ERR_INVALID_ARG` ("invalid content-length header").
 * fetch() computes the header itself, so dropping it is safe.
 *
 * Passed as the `transformRequest` option, which the webdriver package
 * applies to every request after building it (including the header).
 */
export function stripContentLengthHeader(requestOptions) {
  requestOptions.headers?.delete?.('content-length');
  return requestOptions;
}
