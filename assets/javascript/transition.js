export const transition = ($el, timeout,
    {to, using, from, useTransitions = true} = {}) => {
  return new Promise((resolve) => {
    const change = () => new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (to) {
          $el.classList.add(to);
        } else if (from) {
          $el.classList.remove(from);
        }
      });
    });

    if (useTransitions) {
      requestAnimationFrame(() => {
        $el.classList.add(using);
        requestAnimationFrame(change);

        setTimeout(() => {
          requestAnimationFrame(() => {
            $el.classList.remove(using);
            resolve();
          });
        }, timeout);
      });
    } else {
      change().then(resolve);
    }
  });
};
