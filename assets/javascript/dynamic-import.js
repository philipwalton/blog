try {
  self.__import__ = new Function('u', `return import(u)`);
} catch (e) {
  // FF 61 and Edge 18 do not support import.meta,
  // so we have to hard code the relative base URL.
  const baseURL = new URL('/static/', location).href;

  self.__import__ = (url) => new Promise((resolve, reject) => {
    const uniqProp = `__import_${Math.random().toString(16).slice(2)}__`;
    const script = document.createElement('script');
    const cleanup = () => {
      URL.revokeObjectURL(script.src);
      script.src = script.onerror = script.onload = null;
      script.remove();
      delete self[uniqProp];
    };
    script.type = 'module';
    script.onerror = () => {
      reject(new Error(`Failed to import: ${url}`));
      cleanup();
    };
    script.onload = () => {
      resolve(self[uniqProp]);
      cleanup();
    };

    const absURL = new URL(url, baseURL).href;
    const importText = `import * as m from '${absURL}';self.${uniqProp}=m;`;
    const blob = new Blob([importText], {type: 'text/javascript'});
    script.src = URL.createObjectURL(blob);

    document.head.appendChild(script);
  });
}
