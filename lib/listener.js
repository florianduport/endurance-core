const { emitter } = require('./emitter');

const createListener = () => {
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

  return {
    createListener,
    removeListener,
    onceListener,
    createAnyListener,
    removeAnyListener
  };
};

const listenerInstance = createListener();

module.exports = listenerInstance;

