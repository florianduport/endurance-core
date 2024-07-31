const EventEmitter = require('events');
const emitter = new EventEmitter();

const eventTypes = {};

const eventTypesProxy = new Proxy(eventTypes, {
  get: function(target, name) {
    if (!(name in target)) {
      target[name] = name;
    }
    return target[name];
  }
});

module.exports = { emitter, eventTypes: eventTypesProxy };
