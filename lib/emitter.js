const EventEmitter = require('events');
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

// Ajout de l'array pour les any listeners
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

// Override l'émetteur pour inclure les any listeners
const originalEmit = emitter.emit;
emitter.emit = function(eventName, ...args) {
  anyListeners.forEach(callback => callback(eventName, ...args));
  originalEmit.apply(emitter, [eventName, ...args]);
};

module.exports = { emitter, eventTypes: eventTypesProxy };
