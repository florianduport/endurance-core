import { emitter } from './emitter.js';

const createListener = () => {
  const createListener = (eventName: any, callback: any) => {
    const upperEventName = eventName.toUpperCase();
    emitter.on(upperEventName, callback);
  };

  const removeListener = (eventName: any, callback: any) => {
    const upperEventName = eventName.toUpperCase();
    emitter.off(upperEventName, callback);
  };

  const onceListener = (eventName: any, callback: any) => {
    const upperEventName = eventName.toUpperCase();
    emitter.once(upperEventName, callback);
  };

  const createAnyListener = (callback: any) => {
    // @ts-expect-error TS(2339): Property 'onAny' does not exist on type 'EventEmit... Remove this comment to see the full error message
    emitter.onAny(callback);
  };

  const removeAnyListener = (callback: any) => {
    // @ts-expect-error TS(2339): Property 'offAny' does not exist on type 'EventEmi... Remove this comment to see the full error message
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

export default listenerInstance;
