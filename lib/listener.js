const { emitter } = require('./emitter');

const createListener = (eventName, callback) => {
  const upperEventName = eventName.toUpperCase();
  emitter.on(upperEventName, callback);
};

const removeListener = (eventName, callback) => {
  const upperEventName = eventName.toUpperCase();
  emitter.off(upperEventName, callback);
};

const onceListener = (eventName, callback) => {
  const upperEventName = eventName.toUpperCase();
  emitter.once(upperEventName, callback);
};

const createAnyListener = (callback) => {
  emitter.onAny(callback);
};

const removeAnyListener = (callback) => {
  emitter.offAny(callback);
};

module.exports = {
  createListener,
  removeListener,
  onceListener,
  createAnyListener,
  removeAnyListener
};
