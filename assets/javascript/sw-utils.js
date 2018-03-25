export const registrationActivated = (registration) => {
  return new Promise((resolve) => {
    if (registration.active) {
      resolve(registration.active);
    } else {
      registration.addEventListener('updatefound', () => {
        swActivated(registration.installing).then(resolve);
      }, {once: true});
    }
  });
};

export const swActivated = (sw) => {
  return new Promise((resolve) => {
    if (sw.state === 'activated') {
      resolve(sw);
    } else {
      sw.addEventListener('statechange', function fn() {
        if (sw.state === 'activated') {
          sw.removeEventListener('statechange', fn);
          resolve(sw);
        }
      });
    }
  });
};

export const onSwUpdate = (registration, callback) => {
  registration.addEventListener('updatefound', () => {
    const sw = registration.installing;
    callback(sw);
  });
};

export const onNewSwActive = (registration, callback) => {
  onSwUpdate(registration, (sw) => {
    swActivated(sw).then(callback);
  });
};

export const messageSw = (sw, data) => {
  return new Promise((resolve) => {
    let messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (evt) => resolve(evt.data);
    sw.postMessage(data, [messageChannel.port2]);
  });
};
