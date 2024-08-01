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

module.exports = { emitter, eventTypes: eventTypesProxy };
