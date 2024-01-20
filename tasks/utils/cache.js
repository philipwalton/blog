class Cache {
  constructor() {
    this._lastModified = new Date();
  }

  get lastModified() {
    return this._lastModified;
  }

  invalidate() {
    this._lastModified = new Date();
  }
}

export const cssCache = new Cache();
export const jsCache = new Cache();
