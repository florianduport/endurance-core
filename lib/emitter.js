const EventEmitter = require('events');

const createEmitter = () => {
  const emitter = new EventEmitter();

  const eventTypes = {};

  const eventTypesProxy = new Proxy(eventTypes, {
    get: function(target, name) {
      const upperName = name.toUpperCase();
      if (!(upperName in target)) {
        target[upperName] = upperName;
      }
      return target[upperName];
    }
  });

  const anyListeners = [];

  emitter.onAny = (callback) => {
    anyListeners.push(callback);
  };

  emitter.offAny = (callback) => {
    const index = anyListeners.indexOf(callback);
    if (index !== -1) {
      anyListeners.splice(index, 1);
    }
  };

  const originalEmit = emitter.emit;
  emitter.emit = function(eventName, ...args) {
    anyListeners.forEach(callback => callback(eventName, ...args));
    originalEmit.apply(emitter, [eventName, ...args]);
  };

  return { emitter, eventTypes: eventTypesProxy };
};


const emitterInstance = createEmitter();

module.exports = emitterInstance;
